package api

import (
	"context"

	"github.com/stashapp/stash-box/internal/models"
	"github.com/stashapp/stash-box/internal/service/scene"
)

type sceneCreditResolver struct{ *Resolver }

func (r *sceneCreditResolver) Performer(ctx context.Context, obj *models.SceneCredit) (*models.Performer, error) {
	return r.services.Performer().FindByID(ctx, obj.PerformerID)
}

func (r *sceneCreditResolver) CreditRole(ctx context.Context, obj *models.SceneCredit) (*models.CreditRole, error) {
	return r.services.CreditRole().FindByID(ctx, int(obj.CreditRoleID))
}

func (r *sceneCreditResolver) Tags(ctx context.Context, obj *models.SceneCredit) ([]models.Tag, error) {
	// Use the LoadCreditTagsByCompositeIDs function with a single key
	key := scene.CreditCompositeKey{
		SceneID:      obj.SceneID,
		PerformerID:  obj.PerformerID,
		CreditRoleID: int(obj.CreditRoleID),
	}

	results, errs := r.services.Scene().LoadCreditTagsByCompositeIDs(ctx, []scene.CreditCompositeKey{key})
	if len(errs) > 0 && errs[0] != nil {
		return nil, errs[0]
	}

	if len(results) == 0 {
		return []models.Tag{}, nil
	}

	return results[0], nil
}
