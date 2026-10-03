package site

import (
	"context"

	qb "github.com/stashapp/stash-box/pkg/querybuilder"

	"github.com/stashapp/stash-box/internal/converter"
	"github.com/stashapp/stash-box/internal/models"
	queryhelper "github.com/stashapp/stash-box/internal/service/query"
	schema "github.com/stashapp/stash-box/internal/service/query/schema"
)

func (s *Site) Query(ctx context.Context) ([]models.Site, int, error) {
	query := qb.Select(schema.Sites.AllColumns).From(schema.Sites).OrderBy(schema.Sites.Name.ASC())
	countQuery := qb.Select(qb.COUNT(qb.STAR)).From(schema.Sites)
	count, err := queryhelper.ExecuteCount(ctx, countQuery, s.queries.DB(), "QuerySitesCount")
	if err != nil {
		return nil, 0, err
	}
	sites, err := queryhelper.ExecuteQuery(ctx, query, s.queries.DB(), converter.SiteToModel, "QuerySites")
	if err != nil {
		return nil, 0, err
	}
	return sites, count, nil
}
