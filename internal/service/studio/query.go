package studio

import (
	"context"
	"github.com/gofrs/uuid"
	"strings"

	qb "github.com/stashapp/stash-box/pkg/querybuilder"

	"github.com/stashapp/stash-box/internal/auth"
	"github.com/stashapp/stash-box/internal/models"
	queryhelper "github.com/stashapp/stash-box/internal/service/query"
	schema "github.com/stashapp/stash-box/internal/service/query/schema"
)

func (s *Studio) Query(ctx context.Context, input models.StudioQueryInput) (*models.QueryStudiosResultType, error) {
	user := auth.GetCurrentUser(ctx)
	query := s.buildStudioQuery(input, user.ID, false)
	sort := qb.Expression(schema.Studios.Name)
	switch input.Sort {
	case models.StudioSortEnumCreatedAt:
		sort = schema.Studios.CreatedAt
	case models.StudioSortEnumUpdatedAt:
		sort = schema.Studios.UpdatedAt
	}
	queryhelper.ApplySort(query, sort, strings.ToUpper(input.Direction.String()))
	queryhelper.ApplyPagination(query, input.Page, input.PerPage)
	count, err := queryhelper.ExecuteCount(ctx, s.buildStudioQuery(input, user.ID, true), s.queries.DB(), "QueryStudiosCount")
	if err != nil {
		return nil, err
	}
	ids, err := queryhelper.ExecuteIDQuery(ctx, query, s.queries.DB(), "QueryStudios")
	if err != nil {
		return nil, err
	}
	studioPtrs, loadErrs := s.LoadIds(ctx, ids)
	for _, loadErr := range loadErrs {
		if loadErr != nil {
			return nil, loadErr
		}
	}
	studios := make([]models.Studio, 0, len(studioPtrs))
	for _, studio := range studioPtrs {
		if studio != nil {
			studios = append(studios, *studio)
		}
	}
	return &models.QueryStudiosResultType{Count: count, Studios: studios}, nil
}

func (s *Studio) buildStudioQuery(input models.StudioQueryInput, userID uuid.UUID, forCount bool) *qb.Builder {
	parent := schema.Studios.AS("parent_studio")
	projection := qb.Projection(schema.Studios.ID)
	if forCount {
		projection = qb.COUNT(qb.DISTINCT(schema.Studios.ID))
	}
	query := qb.Select(projection).From(schema.Studios).
		LeftJoin(parent, schema.Studios.ParentStudioID.EQ(parent.ID)).
		Where(schema.Studios.Deleted.EQ(qb.Bool(false)))
	if input.URL != nil && *input.URL != "" {
		query.Join(schema.StudioUrls, schema.Studios.ID.EQ(schema.StudioUrls.StudioID)).
			Where(schema.StudioUrls.URL.EQ(qb.String(*input.URL)))
	}
	if input.Name != nil && *input.Name != "" {
		query.Where(queryhelper.ILike(schema.Studios.Name, "%"+*input.Name+"%"))
	}
	if input.Names != nil && *input.Names != "" {
		term := "%" + *input.Names + "%"
		lower := strings.ToLower(term)
		query.Where(qb.OR(
			queryhelper.ILike(schema.Studios.Name, term), queryhelper.ILike(parent.Name, term),
			qb.Raw[bool]("EXISTS (SELECT S.id FROM studios S LEFT JOIN studio_aliases SA ON S.id = SA.studio_id WHERE studios.id = S.id AND (LOWER(S.name) LIKE ? OR LOWER(SA.alias) LIKE ?) GROUP BY S.id)", lower, lower),
		))
	}
	if input.HasParent != nil {
		if *input.HasParent {
			query.Where(parent.ID.IS_NOT_NULL())
		} else {
			query.Where(parent.ID.IS_NULL())
		}
	}
	if input.Parent != nil {
		queryhelper.ApplyIDCriterion(query, schema.Studios.ParentStudioID, input.Parent)
	}
	if input.IsFavorite != nil {
		favorite := schema.StudioFavorites.AS("F")
		if *input.IsFavorite {
			query.Join(favorite, schema.Studios.ID.EQ(favorite.StudioID)).Where(favorite.UserID.EQ(qb.UUID(userID)))
		} else {
			query.LeftJoin(favorite, qb.AND(schema.Studios.ID.EQ(favorite.StudioID), favorite.UserID.EQ(qb.UUID(userID)))).Where(favorite.StudioID.IS_NULL())
		}
	}
	return query
}
