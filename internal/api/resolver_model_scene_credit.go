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
	results, errs := r.services.Scene().LoadCreditAttributesBySceneCreditIDs(ctx, []int32{obj.ID})
	if len(errs) > 0 && errs[0] != nil {
		return nil, errs[0]
	}

	if len(results) == 0 {
		return []models.CreditAttribute{}, nil
	}

	return results[0], nil
}
