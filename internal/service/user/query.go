package user

import (
	"context"

	qb "github.com/stashapp/stash-box/pkg/querybuilder"

	"github.com/stashapp/stash-box/internal/models"
	queryhelper "github.com/stashapp/stash-box/internal/service/query"
	schema "github.com/stashapp/stash-box/internal/service/query/schema"
)

func (s *User) Query(ctx context.Context, input models.UserQueryInput) (*models.QueryUsersResultType, error) {
	query := qb.Select(schema.Users.ID).From(schema.Users)
	if input.Name != nil && *input.Name != "" {
		term := "%" + *input.Name + "%"
		query.Where(qb.OR(queryhelper.ILike(schema.Users.Name, term), queryhelper.ILike(schema.Users.Email, term)))
	}

	count, err := queryhelper.ExecuteCount(ctx, qb.Count(query, "subquery"), s.queries.DB(), "QueryUsersCount")
	if err != nil {
		return nil, err
	}
	query.OrderBy(schema.Users.Name.ASC())
	queryhelper.ApplyPagination(query, input.Page, input.PerPage)
	ids, err := queryhelper.ExecuteIDQuery(ctx, query, s.queries.DB(), "QueryUsers")
	if err != nil {
		return nil, err
	}

	userPtrs, loadErrs := s.LoadIds(ctx, ids)
	for _, loadErr := range loadErrs {
		if loadErr != nil {
			return nil, loadErr
		}
	}
	users := make([]models.User, 0, len(userPtrs))
	for _, user := range userPtrs {
		if user != nil {
			users = append(users, *user)
		}
	}
	return &models.QueryUsersResultType{Count: count, Users: users}, nil
}
