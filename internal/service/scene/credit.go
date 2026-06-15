package scene

import (
	"context"
	"fmt"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/internal/converter"
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
			ID:           int32(credit.ID),
			SceneID:      credit.SceneID,
			PerformerID:  credit.PerformerID,
			CreditTypeID: int32(credit.CreditTypeID),
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

// LoadCreditAttributesBySceneCreditIDs loads attributes for scene credits, keyed by scene_credit id (for DataLoader)
func (s *Scene) LoadCreditAttributesBySceneCreditIDs(ctx context.Context, creditIDs []int32) ([][]models.CreditAttribute, []error) {
	if len(creditIDs) == 0 {
		return make([][]models.CreditAttribute, 0), nil
	}

	ids := make([]int, len(creditIDs))
	for i, id := range creditIDs {
		ids[i] = int(id)
	}

	rows, err := s.queries.FindCreditAttributesBySceneCreditIds(ctx, ids)
	if err != nil {
		return nil, errutil.DuplicateError(err, len(creditIDs))
	}

	// Group results by scene_credit id
	m := make(map[int][]models.CreditAttribute)
	for _, row := range rows {
		m[row.SceneCreditID] = append(m[row.SceneCreditID], converter.CreditAttributeToModel(row.CreditAttribute))
	}

	// Build result in the same order as input ids
	result := make([][]models.CreditAttribute, len(creditIDs))
	for i, id := range creditIDs {
		result[i] = m[int(id)]
	}

	return result, nil
}

// ValidateCreditInput validates a credit input, ensuring attributes are applicable to the credit type
func (s *Scene) ValidateCreditInput(ctx context.Context, input models.CreditInput) error {
	if len(input.AttributeIDs) == 0 {
		return nil // No attributes to validate
	}

	// Collect unique attribute ids
	seen := make(map[int32]bool)
	attrIDs := make([]int, 0, len(input.AttributeIDs))
	for _, id := range input.AttributeIDs {
		if !seen[id] {
			seen[id] = true
			attrIDs = append(attrIDs, int(id))
		}
	}

	validIDs, err := s.queries.GetValidAttributeIDsForType(ctx, queries.GetValidAttributeIDsForTypeParams{
		AttributeIds: attrIDs,
		CreditTypeID: int(input.CreditTypeID),
	})
	if err != nil {
		return fmt.Errorf("failed to validate credit attributes: %w", err)
	}

	if len(validIDs) != len(attrIDs) {
		return fmt.Errorf("one or more attributes are not valid for this credit type")
	}

	return nil
}

// CreateCredit creates a scene credit with validation
func (s *Scene) CreateCredit(ctx context.Context, sceneID uuid.UUID, input models.CreditInput) error {
	if err := s.ValidateCreditInput(ctx, input); err != nil {
		return err
	}

	return s.withTxn(func(tx *queries.Queries) error {
		credit, err := tx.CreateSceneCredit(ctx, queries.CreateSceneCreditParams{
			SceneID:      sceneID,
			PerformerID:  input.PerformerID,
			CreditTypeID: int(input.CreditTypeID),
			As:           input.As,
		})
		if err != nil {
			return err
		}

		return createCreditAttributes(ctx, tx, credit.ID, input.AttributeIDs)
	})
}

// DeleteCredits deletes all credits for a scene
func (s *Scene) DeleteCredits(ctx context.Context, sceneID uuid.UUID) error {
	return s.withTxn(func(tx *queries.Queries) error {
		// Delete the credits (cascade will handle attributes automatically)
		return tx.DeleteSceneCredits(ctx, sceneID)
	})
}

// UpdateCredits replaces all credits for a scene
func (s *Scene) UpdateCredits(ctx context.Context, sceneID uuid.UUID, inputs []models.CreditInput) error {
	return s.withTxn(func(tx *queries.Queries) error {
		// Delete existing credits (cascade will handle attributes)
		if err := tx.DeleteSceneCredits(ctx, sceneID); err != nil {
			return err
		}

		for _, input := range inputs {
			if err := s.ValidateCreditInput(ctx, input); err != nil {
				return err
			}

			credit, err := tx.CreateSceneCredit(ctx, queries.CreateSceneCreditParams{
				SceneID:      sceneID,
				PerformerID:  input.PerformerID,
				CreditTypeID: int(input.CreditTypeID),
				As:           input.As,
			})
			if err != nil {
				return err
			}

			if err := createCreditAttributes(ctx, tx, credit.ID, input.AttributeIDs); err != nil {
				return err
			}
		}

		return nil
	})
}

func createCreditAttributes(ctx context.Context, tx *queries.Queries, sceneCreditID int, attributeIDs []int32) error {
	if len(attributeIDs) == 0 {
		return nil
	}
	params := make([]queries.CreateSceneCreditAttributesParams, 0, len(attributeIDs))
	for _, attrID := range attributeIDs {
		params = append(params, queries.CreateSceneCreditAttributesParams{
			SceneCreditID:     sceneCreditID,
			CreditAttributeID: int(attrID),
		})
	}
	_, err := tx.CreateSceneCreditAttributes(ctx, params)
	return err
}

// CountCreditsByPerformer counts the number of credits for a performer
func (s *Scene) CountCreditsByPerformer(ctx context.Context, performerID uuid.UUID) (int64, error) {
	return s.queries.CountScenesByPerformer(ctx, performerID)
}
