package query

import (
	"testing"

	schema "github.com/stashapp/stash-box/internal/service/query/schema"
	qb "github.com/stashapp/stash-box/pkg/querybuilder"
	"github.com/stretchr/testify/assert"
)

func TestPagination(t *testing.T) {
	tests := []struct {
		name       string
		page       int
		perPage    int
		wantLimit  int32
		wantOffset int32
	}{
		{"negative page defaults", -1, 25, 25, 0},
		{"zero page defaults", 0, 25, 25, 0},
		{"page one offset zero", 1, 40, 40, 0},
		{"page two offset", 2, 40, 40, 40},
		{"negative per page defaults", 1, -1, 25, 0},
		{"zero per page defaults", 1, 0, 25, 0},
		{"per page at max", 1, 100, 100, 0},
		{"per page above max", 1, 101, 100, 0},
		{"per page far above max", 1, 1000, 100, 0},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			p := Pagination(tt.page, tt.perPage)
			assert.Equal(t, tt.wantLimit, p.Limit)
			assert.Equal(t, tt.wantOffset, p.Offset)
		})
	}
}
func TestApplyPaginationNormalizes(t *testing.T) {
	q := qb.Select(schema.Scenes.AllColumns).From(schema.Scenes)

	sql, args := ApplyPagination(q, 1, 500).Sql()
	assert.Contains(t, sql, "LIMIT $1")
	assert.Contains(t, sql, "OFFSET $2")
	assert.Equal(t, []any{int64(100), int64(0)}, args)

	q = qb.Select(schema.Scenes.AllColumns).From(schema.Scenes)
	sql, args = ApplyPagination(q, 2, 40).Sql()
	assert.Equal(t, []any{int64(40), int64(40)}, args)

	// Unset per_page defaults to 25.
	q = qb.Select(schema.Scenes.AllColumns).From(schema.Scenes)
	sql, args = ApplyPagination(q, 1, 0).Sql()
	assert.Equal(t, []any{int64(25), int64(0)}, args)

	// Unset page defaults to 1 (offset 0).
	q = qb.Select(schema.Scenes.AllColumns).From(schema.Scenes)
	sql, args = ApplyPagination(q, 0, 40).Sql()
	assert.Equal(t, []any{int64(40), int64(0)}, args)
}
