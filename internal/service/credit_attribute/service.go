package creditattribute

import (
	"context"
	"fmt"
	"sync"

	"github.com/stashapp/stash-box/internal/converter"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stashapp/stash-box/internal/queries"
	"github.com/stashapp/stash-box/internal/service/errutil"
)

type CreditAttribute struct {
	queries *queries.Queries
	withTxn queries.WithTxnFunc

	// In-memory cache
	cacheMu       sync.RWMutex
	attrsCache    []models.CreditAttribute
	attrsByID     map[int32]*models.CreditAttribute
	typeIDsByAttr map[int32][]int32 // applicable credit type ids per attribute
}

func NewCreditAttribute(queries *queries.Queries, withTxn queries.WithTxnFunc) *CreditAttribute {
	return &CreditAttribute{
		queries:       queries,
		withTxn:       withTxn,
		attrsByID:     make(map[int32]*models.CreditAttribute),
		typeIDsByAttr: make(map[int32][]int32),
	}
}

// WithTxn executes a function within a transaction
func (s *CreditAttribute) WithTxn(fn func(*queries.Queries) error) error {
	return s.withTxn(fn)
}

// LoadCache loads all credit attributes and their applicable types into memory
func (s *CreditAttribute) LoadCache(ctx context.Context) error {
	s.cacheMu.Lock()
	defer s.cacheMu.Unlock()

	attrs, err := s.queries.GetAllCreditAttributes(ctx)
	if err != nil {
		return fmt.Errorf("failed to load credit attributes: %w", err)
	}

	s.attrsCache = converter.CreditAttributesToModels(attrs)
	s.attrsByID = make(map[int32]*models.CreditAttribute, len(s.attrsCache))
	for i := range s.attrsCache {
		s.attrsByID[s.attrsCache[i].ID] = &s.attrsCache[i]
	}

	pairs, err := s.queries.GetAllCreditAttributeTypes(ctx)
	if err != nil {
		return fmt.Errorf("failed to load credit attribute types: %w", err)
	}

	s.typeIDsByAttr = make(map[int32][]int32)
	for _, p := range pairs {
		s.typeIDsByAttr[int32(p.CreditAttributeID)] = append(s.typeIDsByAttr[int32(p.CreditAttributeID)], int32(p.CreditTypeID))
	}

	return nil
}

func (s *CreditAttribute) invalidateCache() {
	s.cacheMu.Lock()
	defer s.cacheMu.Unlock()

	s.attrsCache = nil
	s.attrsByID = make(map[int32]*models.CreditAttribute)
	s.typeIDsByAttr = make(map[int32][]int32)
}

func (s *CreditAttribute) ensureCache(ctx context.Context) error {
	s.cacheMu.RLock()
	loaded := s.attrsCache != nil
	s.cacheMu.RUnlock()
	if loaded {
		return nil
	}
	return s.LoadCache(ctx)
}

// Queries

func (s *CreditAttribute) FindByID(ctx context.Context, id int) (*models.CreditAttribute, error) {
	if err := s.ensureCache(ctx); err != nil {
		return nil, err
	}

	s.cacheMu.RLock()
	defer s.cacheMu.RUnlock()
	if a, ok := s.attrsByID[int32(id)]; ok {
		return a, nil
	}

	return nil, errutil.IgnoreNotFound(fmt.Errorf("credit attribute not found"))
}

func (s *CreditAttribute) GetAll(ctx context.Context) ([]models.CreditAttribute, error) {
	if err := s.ensureCache(ctx); err != nil {
		return nil, err
	}

	s.cacheMu.RLock()
	defer s.cacheMu.RUnlock()
	result := make([]models.CreditAttribute, len(s.attrsCache))
	copy(result, s.attrsCache)
	return result, nil
}

// GetCreditTypeIDs returns the credit type ids an attribute is applicable to.
func (s *CreditAttribute) GetCreditTypeIDs(ctx context.Context, attributeID int) ([]int32, error) {
	if err := s.ensureCache(ctx); err != nil {
		return nil, err
	}

	s.cacheMu.RLock()
	defer s.cacheMu.RUnlock()
	ids := s.typeIDsByAttr[int32(attributeID)]
	result := make([]int32, len(ids))
	copy(result, ids)
	return result, nil
}

// Mutations

func (s *CreditAttribute) Create(ctx context.Context, input models.CreditAttributeCreateInput) (*models.CreditAttribute, error) {
	var attr queries.CreditAttribute
	err := s.withTxn(func(tx *queries.Queries) error {
		var err error
		attr, err = tx.CreateCreditAttribute(ctx, queries.CreateCreditAttributeParams{
			Name:        input.Name,
			Description: input.Description,
		})
		return err
	})

	if err == nil {
		s.invalidateCache()
	}

	return converter.CreditAttributeToModelPtr(attr), err
}

func (s *CreditAttribute) Update(ctx context.Context, input models.CreditAttributeUpdateInput) (*models.CreditAttribute, error) {
	var attr queries.CreditAttribute
	err := s.withTxn(func(tx *queries.Queries) error {
		existing, err := tx.FindCreditAttribute(ctx, int(input.ID))
		if err != nil {
			return err
		}

		if input.Name != nil {
			existing.Name = *input.Name
		}
		if input.Description != nil {
			existing.Description = input.Description
		}

		attr, err = tx.UpdateCreditAttribute(ctx, queries.UpdateCreditAttributeParams{
			ID:          existing.ID,
			Name:        existing.Name,
			Description: existing.Description,
		})
		return err
	})

	if err == nil {
		s.invalidateCache()
	}

	return converter.CreditAttributeToModelPtr(attr), err
}

func (s *CreditAttribute) Delete(ctx context.Context, input models.CreditAttributeDestroyInput) error {
	count, err := s.queries.CountCreditsUsingAttribute(ctx, int(input.ID))
	if err != nil {
		return err
	}
	if count > 0 {
		return fmt.Errorf("cannot delete credit attribute: %d credits are using this attribute", count)
	}

	err = s.withTxn(func(tx *queries.Queries) error {
		return tx.DeleteCreditAttribute(ctx, int(input.ID))
	})

	if err == nil {
		s.invalidateCache()
	}

	return err
}

func (s *CreditAttribute) SetCreditTypes(ctx context.Context, attributeID int, creditTypeIDs []int32) error {
	err := s.withTxn(func(tx *queries.Queries) error {
		if err := tx.DeleteAllCreditAttributeTypes(ctx, int(attributeID)); err != nil {
			return fmt.Errorf("failed to delete existing credit types: %w", err)
		}

		for _, typeID := range creditTypeIDs {
			if err := tx.CreateCreditAttributeType(ctx, queries.CreateCreditAttributeTypeParams{
				CreditAttributeID: int(attributeID),
				CreditTypeID:      int(typeID),
			}); err != nil {
				return fmt.Errorf("failed to create credit type association: %w", err)
			}
		}

		return nil
	})

	if err == nil {
		s.invalidateCache()
	}

	return err
}
