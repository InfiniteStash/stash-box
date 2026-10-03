package query

import (
	qb "github.com/stashapp/stash-box/pkg/querybuilder"
)

const DefaultPerPage = 25
const MaxPerPage = 100

type PageParams struct {
	Limit  int32
	Offset int32
}

func Pagination(page, perPage int) PageParams {
	if page <= 0 {
		page = 1
	}
	if perPage <= 0 {
		perPage = DefaultPerPage
	}
	if perPage > MaxPerPage {
		perPage = MaxPerPage
	}
	return PageParams{
		Limit:  int32(perPage),
		Offset: int32((page - 1) * perPage),
	}
}

func ApplyPagination(query *qb.Builder, page, perPage int) *qb.Builder {
	p := Pagination(page, perPage)
	return query.Limit(int64(p.Limit)).Offset(int64(p.Offset))
}

func ApplySort(query *qb.Builder, expression qb.Expression, direction string) *qb.Builder {
	if direction == "DESC" {
		return query.OrderBy(qb.Desc(expression))
	}
	return query.OrderBy(qb.Asc(expression))
}
