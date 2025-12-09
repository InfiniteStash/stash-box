package api

import (
	"context"
	"time"

	"github.com/stashapp/stash-box/internal/models"
)

type creditRoleResolver struct{ *Resolver }

func (r *creditRoleResolver) ValidTags(ctx context.Context, obj *models.CreditRole) ([]models.Tag, error) {
	tagIDs, err := r.services.CreditRole().GetValidTags(ctx, int(obj.ID))
	if err != nil {
		return nil, err
	}

	if len(tagIDs) == 0 {
		return []models.Tag{}, nil
	}

	tags := make([]models.Tag, len(tagIDs))
	for i, tagID := range tagIDs {
		tag, err := r.services.Tag().FindByID(ctx, tagID)
		if err != nil {
			return nil, err
		}
		tags[i] = *tag
	}

	return tags, nil
}

func (r *creditRoleResolver) Created(ctx context.Context, obj *models.CreditRole) (*time.Time, error) {
	return &obj.CreatedAt, nil
}

func (r *creditRoleResolver) Updated(ctx context.Context, obj *models.CreditRole) (*time.Time, error) {
	return &obj.UpdatedAt, nil
}

// Query resolvers

func (r *queryResolver) FindCreditRole(ctx context.Context, id int) (*models.CreditRole, error) {
	return r.services.CreditRole().FindByID(ctx, id)
}

func (r *queryResolver) GetCreditRoles(ctx context.Context) ([]models.CreditRole, error) {
	return r.services.CreditRole().GetAll(ctx)
}

func (r *queryResolver) QueryCreditRoles(ctx context.Context) ([]*models.CreditRole, error) {
	creditRoles, err := r.services.CreditRole().GetAll(ctx)
	if err != nil {
		return nil, err
	}

	result := make([]*models.CreditRole, len(creditRoles))
	for i := range creditRoles {
		result[i] = &creditRoles[i]
	}
	return result, nil
}

// Mutation resolvers

func (r *mutationResolver) CreditRoleCreate(ctx context.Context, input models.CreditRoleCreateInput) (*models.CreditRole, error) {
	return r.services.CreditRole().Create(ctx, input)
}

func (r *mutationResolver) CreditRoleUpdate(ctx context.Context, input models.CreditRoleUpdateInput) (*models.CreditRole, error) {
	return r.services.CreditRole().Update(ctx, input)
}

func (r *mutationResolver) CreditRoleDestroy(ctx context.Context, input models.CreditRoleDestroyInput) (bool, error) {
	err := r.services.CreditRole().Delete(ctx, input)
	return err == nil, err
}

func (r *mutationResolver) CreditRoleSetTags(ctx context.Context, input models.CreditRoleSetTagsInput) (*models.CreditRole, error) {
	if err := r.services.CreditRole().SetTags(ctx, int(input.RoleID), input.TagIds); err != nil {
		return nil, err
	}

	return r.services.CreditRole().FindByID(ctx, int(input.RoleID))
}
