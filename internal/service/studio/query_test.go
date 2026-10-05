package studio

import (
	"testing"

	sq "github.com/Masterminds/squirrel"
	"github.com/gofrs/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/stashapp/stash-box/internal/models"
)

func pointer[T any](v T) *T { return &v }

func TestBuildStudioQueryFilters(t *testing.T) {
	id := uuid.Must(uuid.NewV4())
	userID := uuid.Must(uuid.NewV4())
	tests := []struct {
		name      string
		input     models.StudioQueryInput
		fragments []string
		args      []any
	}{
		{"base", models.StudioQueryInput{}, []string{"SELECT studios.id", "studios.deleted = $1"}, []any{false}},
		{"url", models.StudioQueryInput{URL: pointer("url")}, []string{"JOIN studio_urls", "studio_urls.url = $2"}, []any{false, "url"}},
		{"name", models.StudioQueryInput{Name: pointer("Studio")}, []string{"studios.name ILIKE $2"}, []any{false, "%Studio%"}},
		{"names", models.StudioQueryInput{Names: pointer("Studio")}, []string{"parent_studio.name ILIKE", "studio_aliases"}, []any{false, "%Studio%", "%Studio%", "%studio%", "%studio%"}},
		{"has parent", models.StudioQueryInput{HasParent: pointer(true)}, []string{"parent_studio.id IS NOT NULL"}, []any{false}},
		{"has no parent", models.StudioQueryInput{HasParent: pointer(false)}, []string{"parent_studio.id IS NULL"}, []any{false}},
		{"parent", models.StudioQueryInput{Parent: &models.IDCriterionInput{Modifier: models.CriterionModifierEquals, Value: []uuid.UUID{id}}}, []string{"studios.parent_studio_id = $2"}, []any{false, id.String()}},
		{"favorite", models.StudioQueryInput{IsFavorite: pointer(true)}, []string{"JOIN studio_favorites", "F.user_id = $2"}, []any{false, userID.String()}},
		{"not favorite", models.StudioQueryInput{IsFavorite: pointer(false)}, []string{"LEFT JOIN studio_favorites", "F.studio_id IS NULL"}, []any{userID, false}},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			q := (&Studio{}).buildStudioQuery(sq.StatementBuilder.PlaceholderFormat(sq.Dollar), tt.input, userID, false)
			sql, args, err := q.ToSql()
			require.NoError(t, err)
			for _, fragment := range tt.fragments {
				assert.Contains(t, sql, fragment)
			}
			assert.Equal(t, tt.args, args)
		})
	}

	q := (&Studio{}).buildStudioQuery(sq.StatementBuilder.PlaceholderFormat(sq.Dollar), models.StudioQueryInput{}, userID, true)
	sql, _, err := q.ToSql()
	require.NoError(t, err)
	assert.Contains(t, sql, "COUNT(DISTINCT studios.id)")
}
