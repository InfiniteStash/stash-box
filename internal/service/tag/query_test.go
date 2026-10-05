package tag

import (
	"testing"

	sq "github.com/Masterminds/squirrel"
	"github.com/gofrs/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/stashapp/stash-box/internal/models"
)

func pointer[T any](v T) *T { return &v }

func TestBuildTagQueryFilters(t *testing.T) {
	id := uuid.Must(uuid.NewV4())
	tests := []struct {
		name      string
		input     models.TagQueryInput
		fragments []string
		args      []any
	}{
		{"base", models.TagQueryInput{}, []string{"tags.id", "deleted = $1"}, []any{false}},
		{"name", models.TagQueryInput{Name: pointer("Tag")}, []string{"tags.name ILIKE $2"}, []any{false, "%Tag%"}},
		{"names", models.TagQueryInput{Names: pointer("Tag")}, []string{"tag_aliases", "LOWER(T.name) LIKE $2", "LOWER(TA.alias) LIKE $3"}, []any{false, "%tag%", "%tag%"}},
		{"category", models.TagQueryInput{CategoryID: &id}, []string{"tags.category_id = $2"}, []any{false, id.String()}},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			sql, args, err := buildTagQuery(sq.StatementBuilder.PlaceholderFormat(sq.Dollar), tt.input).ToSql()
			require.NoError(t, err)
			for _, fragment := range tt.fragments {
				assert.Contains(t, sql, fragment)
			}
			assert.Equal(t, tt.args, args)
		})
	}
}
