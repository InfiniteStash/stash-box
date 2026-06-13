package api

import (
	"context"
	"time"

	"github.com/stashapp/stash-box/internal/models"
)

type creditAttributeResolver struct{ *Resolver }

func (r *creditAttributeResolver) CreditTypes(ctx context.Context, obj *models.CreditAttribute) ([]models.CreditType, error) {
	typeIDs, err := r.services.CreditAttribute().GetCreditTypeIDs(ctx, int(obj.ID))
	if err != nil {
		return nil, err
	}

	creditTypes := make([]models.CreditType, 0, len(typeIDs))
	for _, typeID := range typeIDs {
		ct, err := r.services.CreditType().FindByID(ctx, int(typeID))
		if err != nil {
			return nil, err
		}
		if ct != nil {
			creditTypes = append(creditTypes, *ct)
		}
	}

	return creditTypes, nil
}

func (r *creditAttributeResolver) Created(ctx context.Context, obj *models.CreditAttribute) (*time.Time, error) {
	return &obj.CreatedAt, nil
}

func (r *creditAttributeResolver) Updated(ctx context.Context, obj *models.CreditAttribute) (*time.Time, error) {
	return &obj.UpdatedAt, nil
}

// Query resolvers

func (r *queryResolver) GetCreditAttributes(ctx context.Context) ([]models.CreditAttribute, error) {
	return r.services.CreditAttribute().GetAll(ctx)
}

// Mutation resolvers

func (r *mutationResolver) CreditAttributeCreate(ctx context.Context, input models.CreditAttributeCreateInput) (*models.CreditAttribute, error) {
	return r.services.CreditAttribute().Create(ctx, input)
}

func (r *mutationResolver) CreditAttributeUpdate(ctx context.Context, input models.CreditAttributeUpdateInput) (*models.CreditAttribute, error) {
	return r.services.CreditAttribute().Update(ctx, input)
}

func (r *mutationResolver) CreditAttributeDestroy(ctx context.Context, input models.CreditAttributeDestroyInput) (bool, error) {
	err := r.services.CreditAttribute().Delete(ctx, input)
	return err == nil, err
}

func (r *mutationResolver) CreditAttributeSetCreditTypes(ctx context.Context, input models.CreditAttributeSetCreditTypesInput) (*models.CreditAttribute, error) {
	typeIDs := make([]int32, len(input.CreditTypeIds))
	for i, id := range input.CreditTypeIds {
		typeIDs[i] = int32(id)
	}

	if err := r.services.CreditAttribute().SetCreditTypes(ctx, int(input.AttributeID), typeIDs); err != nil {
		return nil, err
	}

	return r.services.CreditAttribute().FindByID(ctx, int(input.AttributeID))
}
