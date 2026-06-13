package api

import (
	"context"

	"github.com/stashapp/stash-box/internal/models"
)

type sceneCreditEditResolver struct{ *Resolver }

func (r *sceneCreditEditResolver) Performer(ctx context.Context, obj *models.SceneCreditEdit) (*models.Performer, error) {
	return r.services.Performer().FindByID(ctx, obj.PerformerID)
}

func (r *sceneCreditEditResolver) CreditType(ctx context.Context, obj *models.SceneCreditEdit) (*models.CreditType, error) {
	return r.services.CreditType().FindByID(ctx, int(obj.CreditTypeID))
}

func (r *sceneCreditEditResolver) Attributes(ctx context.Context, obj *models.SceneCreditEdit) ([]models.CreditAttribute, error) {
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
