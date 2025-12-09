package api

import (
	"context"

	"github.com/stashapp/stash-box/internal/models"
)

type sceneCreditEditResolver struct{ *Resolver }

func (r *sceneCreditEditResolver) Performer(ctx context.Context, obj *models.SceneCreditEdit) (*models.Performer, error) {
	return r.services.Performer().FindByID(ctx, obj.PerformerID)
}

func (r *sceneCreditEditResolver) CreditRole(ctx context.Context, obj *models.SceneCreditEdit) (*models.CreditRole, error) {
	return r.services.CreditRole().FindByID(ctx, int(obj.CreditRoleID))
}

func (r *sceneCreditEditResolver) Tags(ctx context.Context, obj *models.SceneCreditEdit) ([]models.Tag, error) {
	// For edit diffs, convert TagIDs to Tag objects
	return tagList(ctx, obj.TagIDs)
}
