package credit

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

type CreditRole struct {
	queries *queries.Queries
	withTxn queries.WithTxnFunc

	// In-memory cache
	cacheMu    sync.RWMutex
	rolesCache []models.CreditRole
	rolesByID  map[int32]*models.CreditRole
	tagsCache  map[int][]uuid.UUID
}

func NewCreditRole(queries *queries.Queries, withTxn queries.WithTxnFunc) *CreditRole {
	return &CreditRole{
		queries:   queries,
		withTxn:   withTxn,
		rolesByID: make(map[int32]*models.CreditRole),
		tagsCache: make(map[int][]uuid.UUID),
	}
}

// WithTxn executes a function within a transaction
func (s *CreditRole) WithTxn(fn func(*queries.Queries) error) error {
	return s.withTxn(fn)
}

// LoadCache loads all credit roles and their tags into memory
// This should be called on service initialization
func (s *CreditRole) LoadCache(ctx context.Context) error {
	s.cacheMu.Lock()
	defer s.cacheMu.Unlock()

	// Load all roles
	creditRoles, err := s.queries.GetAllCreditRoles(ctx)
	if err != nil {
		return fmt.Errorf("failed to load credit roles: %w", err)
	}

	// Convert and populate caches
	s.rolesCache = converter.CreditRolesToModels(creditRoles)
	s.rolesByID = make(map[int32]*models.CreditRole, len(s.rolesCache))
	for i := range s.rolesCache {
		s.rolesByID[s.rolesCache[i].ID] = &s.rolesCache[i]
	}

	// Load tags for each role
	s.tagsCache = make(map[int][]uuid.UUID, len(s.rolesCache))
	for _, role := range s.rolesCache {
		tagRows, err := s.queries.GetTagsForCreditRole(ctx, int(role.ID))
		if err != nil {
			return fmt.Errorf("failed to load tags for role %d: %w", role.ID, err)
		}

		var tagIDs []uuid.UUID
		for _, row := range tagRows {
			tagIDs = append(tagIDs, row.Tag.ID)
		}
		s.tagsCache[int(role.ID)] = tagIDs
	}

	return nil
}

// invalidateCache clears the cache, forcing a reload on next access
func (s *CreditRole) invalidateCache() {
	s.cacheMu.Lock()
	defer s.cacheMu.Unlock()

	s.rolesCache = nil
	s.rolesByID = make(map[int32]*models.CreditRole)
	s.tagsCache = make(map[int][]uuid.UUID)
}

// Queries

func (s *CreditRole) FindByID(ctx context.Context, id int) (*models.CreditRole, error) {
	// Try cache first
	s.cacheMu.RLock()
	if role, ok := s.rolesByID[int32(id)]; ok {
		s.cacheMu.RUnlock()
		return role, nil
	}
	s.cacheMu.RUnlock()

	// Cache miss or empty - reload cache
	if err := s.LoadCache(ctx); err != nil {
		return nil, err
	}

	// Try again after reload
	s.cacheMu.RLock()
	defer s.cacheMu.RUnlock()
	if role, ok := s.rolesByID[int32(id)]; ok {
		return role, nil
	}

	return nil, errutil.IgnoreNotFound(fmt.Errorf("credit role not found"))
}

func (s *CreditRole) GetAll(ctx context.Context) ([]models.CreditRole, error) {
	// Try cache first
	s.cacheMu.RLock()
	if s.rolesCache != nil {
		result := make([]models.CreditRole, len(s.rolesCache))
		copy(result, s.rolesCache)
		s.cacheMu.RUnlock()
		return result, nil
	}
	s.cacheMu.RUnlock()

	// Cache empty - load it
	if err := s.LoadCache(ctx); err != nil {
		return nil, err
	}

	// Return cached data
	s.cacheMu.RLock()
	defer s.cacheMu.RUnlock()
	result := make([]models.CreditRole, len(s.rolesCache))
	copy(result, s.rolesCache)
	return result, nil
}

func (s *CreditRole) GetValidTags(ctx context.Context, creditRoleID int) ([]uuid.UUID, error) {
	// Try cache first
	s.cacheMu.RLock()
	if tags, ok := s.tagsCache[creditRoleID]; ok {
		result := make([]uuid.UUID, len(tags))
		copy(result, tags)
		s.cacheMu.RUnlock()
		return result, nil
	}
	s.cacheMu.RUnlock()

	// Cache miss - reload cache
	if err := s.LoadCache(ctx); err != nil {
		return nil, err
	}

	// Try again after reload
	s.cacheMu.RLock()
	defer s.cacheMu.RUnlock()
	if tags, ok := s.tagsCache[creditRoleID]; ok {
		result := make([]uuid.UUID, len(tags))
		copy(result, tags)
		return result, nil
	}

	return []uuid.UUID{}, nil
}

func (s *CreditRole) CountByPerformer(ctx context.Context, performerID uuid.UUID) ([]models.PerformerCreditRole, error) {
	rows, err := s.queries.GetCreditRolesByPerformer(ctx, performerID)
	if err != nil {
		return nil, fmt.Errorf("failed to get credit roles by performer: %w", err)
	}

	// Get tag counts for this performer
	tagRows, err := s.queries.GetCreditTagsByPerformer(ctx, performerID)
	if err != nil {
		return nil, fmt.Errorf("failed to get credit tags by performer: %w", err)
	}

	// Group tags by credit role ID
	tagsByRole := make(map[int][]models.PerformerCreditTag)
	for _, tagRow := range tagRows {
		roleID := int(tagRow.CreditRoleID)
		tag := models.PerformerCreditTag{
			Tag:        converter.TagToModelPtr(tagRow.Tag),
			SceneCount: int(tagRow.SceneCount),
		}
		tagsByRole[roleID] = append(tagsByRole[roleID], tag)
	}

	var result []models.PerformerCreditRole
	for _, row := range rows {
		roleID := int(row.CreditRole.ID)
		result = append(result, models.PerformerCreditRole{
			Role:       converter.CreditRoleToModelPtr(row.CreditRole),
			SceneCount: int(row.SceneCount),
			Tags:       tagsByRole[roleID],
		})
	}

	return result, nil
}

// Mutations

func (s *CreditRole) Create(ctx context.Context, input models.CreditRoleCreateInput) (*models.CreditRole, error) {
	var creditRole queries.CreditRole
	err := s.withTxn(func(tx *queries.Queries) error {
		var err error
		creditRole, err = tx.CreateCreditRole(ctx, queries.CreateCreditRoleParams{
			Name:        input.Name,
			Description: input.Description,
		})
		return err
	})

	if err == nil {
		// Invalidate cache to force reload with new role
		s.invalidateCache()
	}

	return converter.CreditRoleToModelPtr(creditRole), err
}

func (s *CreditRole) Update(ctx context.Context, input models.CreditRoleUpdateInput) (*models.CreditRole, error) {
	var creditRole queries.CreditRole
	err := s.withTxn(func(tx *queries.Queries) error {
		existingCreditRole, err := tx.FindCreditRole(ctx, int(input.ID))
		if err != nil {
			return err
		}

		// Apply updates
		if input.Name != nil {
			existingCreditRole.Name = *input.Name
		}
		if input.Description != nil {
			existingCreditRole.Description = input.Description
		}

		creditRole, err = tx.UpdateCreditRole(ctx, queries.UpdateCreditRoleParams{
			ID:          existingCreditRole.ID,
			Name:        existingCreditRole.Name,
			Description: existingCreditRole.Description,
		})
		return err
	})

	if err == nil {
		// Invalidate cache to force reload with updated role
		s.invalidateCache()
	}

	return converter.CreditRoleToModelPtr(creditRole), err
}

func (s *CreditRole) Delete(ctx context.Context, input models.CreditRoleDestroyInput) error {
	// Check if credit role is in use
	count, err := s.queries.CountCreditsForRole(ctx, int(input.ID))
	if err != nil {
		return err
	}
	if count > 0 {
		return fmt.Errorf("cannot delete credit role: %d credits are using this role", count)
	}

	err = s.withTxn(func(tx *queries.Queries) error {
		return tx.DeleteCreditRole(ctx, int(input.ID))
	})

	if err == nil {
		// Invalidate cache to force reload without deleted role
		s.invalidateCache()
	}

	return err
}

func (s *CreditRole) SetTags(ctx context.Context, creditRoleID int, tagIDs []uuid.UUID) error {
	err := s.withTxn(func(tx *queries.Queries) error {
		// Delete all existing tags for this role
		if err := tx.DeleteAllCreditRoleTags(ctx, int(creditRoleID)); err != nil {
			return fmt.Errorf("failed to delete existing tags: %w", err)
		}

		// Insert new tags
		if len(tagIDs) > 0 {
			for _, tagID := range tagIDs {
				if err := tx.CreateCreditRoleTag(ctx, queries.CreateCreditRoleTagParams{
					CreditRoleID: int(creditRoleID),
					TagID:        tagID,
				}); err != nil {
					return fmt.Errorf("failed to create tag association: %w", err)
				}
			}
		}

		return nil
	})

	if err == nil {
		// Invalidate cache to force reload with new tag associations
		s.invalidateCache()
	}

	return err
}
