package scene

import (
	"context"
	"fmt"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/internal/models"
	"github.com/stashapp/stash-box/internal/queries"
	"github.com/stashapp/stash-box/internal/service/errutil"
)

// Credit-related methods for Scene service

// LoadCreditsBySceneIDs loads scene credits for multiple scene IDs (for DataLoader)
func (s *Scene) LoadCreditsBySceneIDs(ctx context.Context, sceneIDs []uuid.UUID) ([][]models.SceneCredit, []error) {
	if len(sceneIDs) == 0 {
		return make([][]models.SceneCredit, 0), nil
	}

	credits, err := s.queries.FindSceneCreditsByIds(ctx, sceneIDs)
	if err != nil {
		return nil, errutil.DuplicateError(err, len(sceneIDs))
	}

	// Group results by scene ID
	m := make(map[uuid.UUID][]models.SceneCredit)
	for _, credit := range credits {
		m[credit.SceneID] = append(m[credit.SceneID], models.SceneCredit{
			SceneID:      credit.SceneID,
			PerformerID:  credit.PerformerID,
			CreditRoleID: int32(credit.CreditRoleID),
			As:           credit.As,
		})
	}

	// Build result in the same order as input IDs
	result := make([][]models.SceneCredit, len(sceneIDs))
	for i, id := range sceneIDs {
		result[i] = m[id]
	}

	return result, nil
}

// LoadPerformancesBySceneIDs loads scene performances (credits with PERFORMANCE type) for backward compatibility
func (s *Scene) LoadPerformancesBySceneIDs(ctx context.Context, sceneIDs []uuid.UUID) ([][]models.PerformerAppearance, []error) {
	if len(sceneIDs) == 0 {
		return make([][]models.PerformerAppearance, 0), nil
	}

	// Get all credits for these scenes
	credits, err := s.queries.FindSceneCreditsByIds(ctx, sceneIDs)
	if err != nil {
		return nil, errutil.DuplicateError(err, len(sceneIDs))
	}

	// Filter to only PERFORMANCE type (id = 1) and group by scene ID
	const performanceTypeID = 1
	m := make(map[uuid.UUID][]models.PerformerAppearance)
	for _, credit := range credits {
		if credit.CreditRoleID == performanceTypeID {
			// Note: The resolver will need to load the performer details
			// We just return the appearance structure with As field
			// The Performer field will be populated by the resolver
			m[credit.SceneID] = append(m[credit.SceneID], models.PerformerAppearance{
				Performer: nil, // Will be loaded by resolver
				As:        credit.As,
			})
		}
	}

	// Build result in the same order as input IDs
	result := make([][]models.PerformerAppearance, len(sceneIDs))
	for i, id := range sceneIDs {
		result[i] = m[id]
	}

	return result, nil
}

// LoadCreditTagsByCompositeIDs loads tags for scene credits (for DataLoader)
type CreditCompositeKey struct {
	SceneID      uuid.UUID
	PerformerID  uuid.UUID
	CreditRoleID int
}

func (s *Scene) LoadCreditTagsByCompositeIDs(ctx context.Context, keys []CreditCompositeKey) ([][]models.Tag, []error) {
	if len(keys) == 0 {
		return make([][]models.Tag, 0), nil
	}

	// Extract unique scene IDs for querying
	sceneIDSet := make(map[uuid.UUID]bool)
	for _, key := range keys {
		sceneIDSet[key.SceneID] = true
	}

	sceneIDs := make([]uuid.UUID, 0, len(sceneIDSet))
	for id := range sceneIDSet {
		sceneIDs = append(sceneIDs, id)
	}

	// Get all credit tags for these scenes
	creditTags, err := s.queries.FindCreditTagsBySceneIds(ctx, sceneIDs)
	if err != nil {
		return nil, errutil.DuplicateError(err, len(keys))
	}

	// Group results by composite key
	m := make(map[CreditCompositeKey][]models.Tag)
	for _, ct := range creditTags {
		key := CreditCompositeKey{
			SceneID:      ct.SceneID,
			PerformerID:  ct.PerformerID,
			CreditRoleID: ct.CreditRoleID,
		}
		// Convert the queries.Tag to models.Tag
		m[key] = append(m[key], models.Tag{
			ID:   ct.Tag.ID,
			Name: ct.Tag.Name,
			// Add other fields if needed by the resolver
		})
	}

	// Build result in the same order as input keys
	result := make([][]models.Tag, len(keys))
	for i, key := range keys {
		result[i] = m[key]
	}

	return result, nil
}

// ValidateCreditInput validates a credit input, ensuring tags are valid for the credit role
func (s *Scene) ValidateCreditInput(ctx context.Context, input models.CreditInput) error {
	if len(input.TagIDs) == 0 {
		return nil // No tags to validate
	}

	// Get valid tags for this credit role
	validTagRows, err := s.queries.GetTagsForCreditRole(ctx, int(input.CreditRoleID))
	if err != nil {
		return fmt.Errorf("failed to get valid tags for credit role: %w", err)
	}

	// If no tags are configured for this credit role, no tags are allowed
	if len(validTagRows) == 0 {
		return fmt.Errorf("no tags are allowed for this credit role")
	}

	// Build a map of valid tag IDs
	validTagMap := make(map[uuid.UUID]bool)
	for _, row := range validTagRows {
		validTagMap[row.Tag.ID] = true
	}

	// Check that all provided tags are valid
	for _, tagID := range input.TagIDs {
		if !validTagMap[tagID] {
			return fmt.Errorf("tag %s is not valid for this credit role", tagID)
		}
	}

	return nil
}

// CreateCredit creates a scene credit with validation
func (s *Scene) CreateCredit(ctx context.Context, sceneID uuid.UUID, input models.CreditInput) error {
	// Validate the input
	if err := s.ValidateCreditInput(ctx, input); err != nil {
		return err
	}

	return s.withTxn(func(tx *queries.Queries) error {
		// Create the credit and get its ID
		credit, err := tx.CreateSceneCredit(ctx, queries.CreateSceneCreditParams{
			SceneID:      sceneID,
			PerformerID:  input.PerformerID,
			CreditRoleID: int(input.CreditRoleID),
			As:           input.As,
		})
		if err != nil {
			return err
		}

		// Create credit tags if any
		if len(input.TagIDs) > 0 {
			var tagParams []queries.CreateSceneCreditTagsParams
			for _, tagID := range input.TagIDs {
				tagParams = append(tagParams, queries.CreateSceneCreditTagsParams{
					SceneCreditID: credit.ID,
					TagID:         tagID,
				})
			}
			_, err = tx.CreateSceneCreditTags(ctx, tagParams)
			if err != nil {
				return err
			}
		}

		return nil
	})
}

// DeleteCredits deletes all credits for a scene
func (s *Scene) DeleteCredits(ctx context.Context, sceneID uuid.UUID) error {
	return s.withTxn(func(tx *queries.Queries) error {
		// Delete the credits (cascade will handle tags automatically)
		return tx.DeleteSceneCredits(ctx, sceneID)
	})
}

// UpdateCredits replaces all credits for a scene
func (s *Scene) UpdateCredits(ctx context.Context, sceneID uuid.UUID, inputs []models.CreditInput) error {
	return s.withTxn(func(tx *queries.Queries) error {
		// Delete existing credits (cascade will handle tags)
		if err := tx.DeleteSceneCredits(ctx, sceneID); err != nil {
			return err
		}

		// Create new credits
		for _, input := range inputs {
			// Validate each input
			if err := s.ValidateCreditInput(ctx, input); err != nil {
				return err
			}

			// Create the credit and get its ID
			credit, err := tx.CreateSceneCredit(ctx, queries.CreateSceneCreditParams{
				SceneID:      sceneID,
				PerformerID:  input.PerformerID,
				CreditRoleID: int(input.CreditRoleID),
				As:           input.As,
			})
			if err != nil {
				return err
			}

			// Create credit tags if any
			if len(input.TagIDs) > 0 {
				var tagParams []queries.CreateSceneCreditTagsParams
				for _, tagID := range input.TagIDs {
					tagParams = append(tagParams, queries.CreateSceneCreditTagsParams{
						SceneCreditID: credit.ID,
						TagID:         tagID,
					})
				}
				_, err = tx.CreateSceneCreditTags(ctx, tagParams)
				if err != nil {
					return err
				}
			}
		}

		return nil
	})
}

// CountCreditsByPerformer counts the number of credits for a performer
func (s *Scene) CountCreditsByPerformer(ctx context.Context, performerID uuid.UUID) (int64, error) {
	return s.queries.CountScenesByPerformer(ctx, performerID)
}
