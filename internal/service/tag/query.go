package tag

import (
	"context"
	"strings"

	qb "github.com/stashapp/stash-box/pkg/querybuilder"

	"github.com/stashapp/stash-box/internal/models"
	queryhelper "github.com/stashapp/stash-box/internal/service/query"
	schema "github.com/stashapp/stash-box/internal/service/query/schema"
)

func (s *Tag) Query(ctx context.Context, input models.TagQueryInput) (*models.QueryTagsResultType, error) {
	query := qb.Select(schema.Tags.ID).From(schema.Tags).Where(schema.Tags.Deleted.EQ(qb.Bool(false)))
	if input.Name != nil && *input.Name != "" {
		query.Where(queryhelper.ILike(schema.Tags.Name, "%"+*input.Name+"%"))
	}
	if input.Names != nil && *input.Names != "" {
		term := strings.ToLower("%" + *input.Names + "%")
		query.Where(qb.Raw[bool](
			"EXISTS (SELECT T.id FROM tags T LEFT JOIN tag_aliases TA ON T.id = TA.tag_id WHERE tags.id = T.id AND (LOWER(T.name) LIKE ? OR LOWER(TA.alias) LIKE ?) GROUP BY T.id)", term, term))
	}
	if input.CategoryID != nil {
		query.Where(schema.Tags.CategoryID.EQ(qb.UUID(*input.CategoryID)))
	}

	count, err := queryhelper.ExecuteCount(ctx, qb.Count(query, "subquery"), s.queries.DB(), "QueryTagsCount")
	if err != nil {
		return nil, err
	}
	sort := qb.Expression(schema.Tags.Name)
	switch input.Sort {
	case models.TagSortEnumCreatedAt:
		sort = schema.Tags.CreatedAt
	case models.TagSortEnumUpdatedAt:
		sort = schema.Tags.UpdatedAt
	}
	queryhelper.ApplySort(query, sort, strings.ToUpper(input.Direction.String()))
	queryhelper.ApplyPagination(query, input.Page, input.PerPage)
	ids, err := queryhelper.ExecuteIDQuery(ctx, query, s.queries.DB(), "QueryTags")
	if err != nil {
		return nil, err
	}
	tagPtrs, loadErrs := s.LoadIds(ctx, ids)
	for _, loadErr := range loadErrs {
		if loadErr != nil {
			return nil, loadErr
		}
	}
	tags := make([]models.Tag, 0, len(tagPtrs))
	for _, tag := range tagPtrs {
		if tag != nil {
			tags = append(tags, *tag)
		}
	}
	return &models.QueryTagsResultType{Count: count, Tags: tags}, nil
}
