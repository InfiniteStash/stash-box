package api

import (
	"context"

	"github.com/stashapp/stash-box/internal/models"
)

type sceneCreditResolver struct{ *Resolver }

func (r *sceneCreditResolver) Performer(ctx context.Context, obj *models.SceneCredit) (*models.Performer, error) {
	return r.services.Performer().FindByID(ctx, obj.PerformerID)
}

func (r *sceneCreditResolver) CreditRole(ctx context.Context, obj *models.SceneCredit) (*models.CreditRole, error) {
	return r.services.CreditRole().FindByID(ctx, int(obj.CreditRoleID))
}

func (r *sceneCreditResolver) Tags(ctx context.Context, obj *models.SceneCredit) ([]models.Tag, error) {
	// TODO: Load tags from scene_credit_tags table when needed
	return []models.Tag{}, nil
}
