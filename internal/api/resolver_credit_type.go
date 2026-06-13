package api

import (
	"context"
	"time"

	"github.com/stashapp/stash-box/internal/models"
)

type creditTypeResolver struct{ *Resolver }

func (r *creditTypeResolver) Created(ctx context.Context, obj *models.CreditType) (*time.Time, error) {
	return &obj.CreatedAt, nil
}

func (r *creditTypeResolver) Updated(ctx context.Context, obj *models.CreditType) (*time.Time, error) {
	return &obj.UpdatedAt, nil
}

// Query resolvers

func (r *queryResolver) GetCreditTypes(ctx context.Context) ([]models.CreditType, error) {
	return r.services.CreditType().GetAll(ctx)
}

// Mutation resolvers

func (r *mutationResolver) CreditTypeCreate(ctx context.Context, input models.CreditTypeCreateInput) (*models.CreditType, error) {
	return r.services.CreditType().Create(ctx, input)
}

func (r *mutationResolver) CreditTypeUpdate(ctx context.Context, input models.CreditTypeUpdateInput) (*models.CreditType, error) {
	return r.services.CreditType().Update(ctx, input)
}

func (r *mutationResolver) CreditTypeDestroy(ctx context.Context, input models.CreditTypeDestroyInput) (bool, error) {
	err := r.services.CreditType().Delete(ctx, input)
	return err == nil, err
}
