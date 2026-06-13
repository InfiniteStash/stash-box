package credittype

import (
	"context"
	"fmt"
	"sync"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/internal/converter"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stashapp/stash-box/internal/queries"
	"github.com/stashapp/stash-box/internal/service/errutil"
)

type CreditType struct {
	queries *queries.Queries
	withTxn queries.WithTxnFunc

	// In-memory cache
	cacheMu    sync.RWMutex
	typesCache []models.CreditType
	typesByID  map[int32]*models.CreditType
}

func NewCreditType(queries *queries.Queries, withTxn queries.WithTxnFunc) *CreditType {
	return &CreditType{
		queries:   queries,
		withTxn:   withTxn,
		typesByID: make(map[int32]*models.CreditType),
	}
}

// WithTxn executes a function within a transaction
func (s *CreditType) WithTxn(fn func(*queries.Queries) error) error {
	return s.withTxn(fn)
}

// LoadCache loads all credit types into memory
func (s *CreditType) LoadCache(ctx context.Context) error {
	s.cacheMu.Lock()
	defer s.cacheMu.Unlock()

	creditTypes, err := s.queries.GetAllCreditTypes(ctx)
	if err != nil {
		return fmt.Errorf("failed to load credit types: %w", err)
	}

	s.typesCache = converter.CreditTypesToModels(creditTypes)
	s.typesByID = make(map[int32]*models.CreditType, len(s.typesCache))
	for i := range s.typesCache {
		s.typesByID[s.typesCache[i].ID] = &s.typesCache[i]
	}

	return nil
}

func (s *CreditType) invalidateCache() {
	s.cacheMu.Lock()
	defer s.cacheMu.Unlock()

	s.typesCache = nil
	s.typesByID = make(map[int32]*models.CreditType)
}

// Queries

func (s *CreditType) FindByID(ctx context.Context, id int) (*models.CreditType, error) {
	s.cacheMu.RLock()
	if t, ok := s.typesByID[int32(id)]; ok {
		s.cacheMu.RUnlock()
		return t, nil
	}
	s.cacheMu.RUnlock()

	if err := s.LoadCache(ctx); err != nil {
		return nil, err
	}

	s.cacheMu.RLock()
	defer s.cacheMu.RUnlock()
	if t, ok := s.typesByID[int32(id)]; ok {
		return t, nil
	}

	return nil, errutil.IgnoreNotFound(fmt.Errorf("credit type not found"))
}

func (s *CreditType) GetAll(ctx context.Context) ([]models.CreditType, error) {
	s.cacheMu.RLock()
	if s.typesCache != nil {
		result := make([]models.CreditType, len(s.typesCache))
		copy(result, s.typesCache)
		s.cacheMu.RUnlock()
		return result, nil
	}
	s.cacheMu.RUnlock()

	if err := s.LoadCache(ctx); err != nil {
		return nil, err
	}

	s.cacheMu.RLock()
	defer s.cacheMu.RUnlock()
	result := make([]models.CreditType, len(s.typesCache))
	copy(result, s.typesCache)
	return result, nil
}

func (s *CreditType) CountByPerformer(ctx context.Context, performerID uuid.UUID) ([]models.PerformerCreditType, error) {
	rows, err := s.queries.GetCreditTypesByPerformer(ctx, performerID)
	if err != nil {
		return nil, fmt.Errorf("failed to get credit types by performer: %w", err)
	}

	var result []models.PerformerCreditType
	for _, row := range rows {
		result = append(result, models.PerformerCreditType{
			CreditType: converter.CreditTypeToModelPtr(row.CreditType),
			SceneCount: int(row.SceneCount),
		})
	}

	return result, nil
}

// Mutations

func (s *CreditType) Create(ctx context.Context, input models.CreditTypeCreateInput) (*models.CreditType, error) {
	var creditType queries.CreditType
	err := s.withTxn(func(tx *queries.Queries) error {
		var err error
		creditType, err = tx.CreateCreditType(ctx, queries.CreateCreditTypeParams{
			Name:        input.Name,
			Description: input.Description,
		})
		return err
	})

	if err == nil {
		s.invalidateCache()
	}

	return converter.CreditTypeToModelPtr(creditType), err
}

func (s *CreditType) Update(ctx context.Context, input models.CreditTypeUpdateInput) (*models.CreditType, error) {
	var creditType queries.CreditType
	err := s.withTxn(func(tx *queries.Queries) error {
		existing, err := tx.FindCreditType(ctx, int(input.ID))
		if err != nil {
			return err
		}

		if input.Name != nil {
			existing.Name = *input.Name
		}
		if input.Description != nil {
			existing.Description = input.Description
		}

		creditType, err = tx.UpdateCreditType(ctx, queries.UpdateCreditTypeParams{
			ID:          existing.ID,
			Name:        existing.Name,
			Description: existing.Description,
		})
		return err
	})

	if err == nil {
		s.invalidateCache()
	}

	return converter.CreditTypeToModelPtr(creditType), err
}

func (s *CreditType) Delete(ctx context.Context, input models.CreditTypeDestroyInput) error {
	count, err := s.queries.CountCreditsForType(ctx, int(input.ID))
	if err != nil {
		return err
	}
	if count > 0 {
		return fmt.Errorf("cannot delete credit type: %d credits are using this type", count)
	}

	err = s.withTxn(func(tx *queries.Queries) error {
		return tx.DeleteCreditType(ctx, int(input.ID))
	})

	if err == nil {
		s.invalidateCache()
	}

	return err
}
