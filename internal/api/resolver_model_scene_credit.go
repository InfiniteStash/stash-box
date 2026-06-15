package api

import (
	"context"

	"github.com/stashapp/stash-box/internal/models"
)

type sceneCreditResolver struct{ *Resolver }

func (r *sceneCreditResolver) Performer(ctx context.Context, obj *models.SceneCredit) (*models.Performer, error) {
	return r.services.Performer().FindByID(ctx, obj.PerformerID)
}

func (r *sceneCreditResolver) CreditType(ctx context.Context, obj *models.SceneCredit) (*models.CreditType, error) {
	return r.services.CreditType().FindByID(ctx, int(obj.CreditTypeID))
}

func (r *sceneCreditResolver) Attributes(ctx context.Context, obj *models.SceneCredit) ([]models.CreditAttribute, error) {
	// Synthetic credits (e.g. an edit's merged credits) have no scene_credits row;
	// their attributes are carried inline rather than loadable by id.
	if obj.ID == 0 {
		attributes := make([]models.CreditAttribute, 0, len(obj.AttributeIDs))
		for _, id := range obj.AttributeIDs {
			attr, err := r.services.CreditAttribute().FindByID(ctx, int(id))
			if err != nil {
				return nil, err
			}
			if attr != nil {
				attributes = append(attributes, *attr)
			}
		}
		return attributes, nil
	}

	results, errs := r.services.Scene().LoadCreditAttributesBySceneCreditIDs(ctx, []int32{obj.ID})
	if len(errs) > 0 && errs[0] != nil {
		return nil, errs[0]
	}

	if len(results) == 0 {
		return []models.CreditAttribute{}, nil
	}

	return results[0], nil
}
