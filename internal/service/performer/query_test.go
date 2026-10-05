package performer

import (
	"testing"

	sq "github.com/Masterminds/squirrel"
	"github.com/gofrs/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/stashapp/stash-box/internal/models"
)

func pointer[T any](v T) *T { return &v }

func performerSQL(t *testing.T, input models.PerformerQueryInput, forCount bool) (string, []any) {
	t.Helper()
	q := (&Performer{}).buildPerformerQuery(sq.StatementBuilder.PlaceholderFormat(sq.Dollar), input, uuid.Nil, forCount)
	sql, args, err := q.ToSql()
	require.NoError(t, err)
	return sql, args
}

func TestBuildPerformerQueryFilters(t *testing.T) {
	id := uuid.Must(uuid.NewV4())
	userID := uuid.Must(uuid.NewV4())
	tests := []struct {
		name      string
		input     models.PerformerQueryInput
		fragments []string
		args      []any
	}{
		{"url", models.PerformerQueryInput{URL: pointer("url")}, []string{"JOIN performer_urls", "performer_urls.url = $1"}, []any{"url", false}},
		{"name", models.PerformerQueryInput{Name: pointer("Jane")}, []string{"performers.name ILIKE $1"}, []any{"%Jane%", false}},
		{"names", models.PerformerQueryInput{Names: pointer("Jane")}, []string{"performers.name ILIKE $1 OR performers.disambiguation ILIKE $2"}, []any{"%Jane%", "%Jane%", false}},
		{"birth year", models.PerformerQueryInput{BirthYear: &models.IntCriterionInput{Modifier: models.CriterionModifierEquals, Value: 1990}}, []string{"EXTRACT(YEAR", "= $1"}, []any{1990, false}},
		{"birthdate", models.PerformerQueryInput{Birthdate: &models.DateCriterionInput{Modifier: models.CriterionModifierGreaterThan, Value: "1990-01-01"}}, []string{"performers.birthdate > $1"}, []any{"1990-01-01", false}},
		{"deathdate", models.PerformerQueryInput{Deathdate: &models.DateCriterionInput{Modifier: models.CriterionModifierIsNull}}, []string{"performers.deathdate IS NULL"}, []any{false}},
		{"age", models.PerformerQueryInput{Age: &models.IntCriterionInput{Modifier: models.CriterionModifierLessThan, Value: 30}}, []string{"EXTRACT(YEAR FROM AGE", "< $1"}, []any{30, false}},
		{"gender", models.PerformerQueryInput{Gender: pointer(models.GenderFilterEnumFemale)}, []string{"performers.gender = $1"}, []any{"FEMALE", false}},
		{"unknown gender", models.PerformerQueryInput{Gender: pointer(models.GenderFilterEnumUnknown)}, []string{"performers.gender IS NULL"}, []any{false}},
		{"ethnicity", models.PerformerQueryInput{Ethnicity: pointer(models.EthnicityFilterEnumAsian)}, []string{"performers.ethnicity = $1"}, []any{"ASIAN", false}},
		{"unknown ethnicity", models.PerformerQueryInput{Ethnicity: pointer(models.EthnicityFilterEnumUnknown)}, []string{"performers.ethnicity IS NULL"}, []any{false}},
		{"favorite", models.PerformerQueryInput{IsFavorite: pointer(true)}, []string{"JOIN performer_favorites", "F.user_id = $1"}, []any{userID.String(), false}},
		{"not favorite", models.PerformerQueryInput{IsFavorite: pointer(false)}, []string{"LEFT JOIN performer_favorites", "F.performer_id IS NULL"}, []any{userID, false}},
		{"performed with", models.PerformerQueryInput{PerformedWith: &id}, []string{"SPP.performer_id = $1", "SP.performer_id != $2"}, []any{&id, &id, false}},
		{"disambiguation", models.PerformerQueryInput{Disambiguation: &models.StringCriterionInput{Modifier: models.CriterionModifierIncludes, Value: "x"}}, []string{"disambiguation ILIKE $1"}, []any{"%x%", false}},
		{"country", models.PerformerQueryInput{Country: &models.StringCriterionInput{Modifier: models.CriterionModifierEquals, Value: "NO"}}, []string{"country = $1"}, []any{"NO", false}},
		{"studio", models.PerformerQueryInput{StudioID: &id}, []string{"COUNT(DISTINCT performers.id)", "studio_id = $1"}, []any{&id, false}},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			q := (&Performer{}).buildPerformerQuery(sq.StatementBuilder.PlaceholderFormat(sq.Dollar), tt.input, userID, tt.name == "studio")
			sql, args, err := q.ToSql()
			require.NoError(t, err)
			for _, fragment := range tt.fragments {
				assert.Contains(t, sql, fragment)
			}
			assert.Equal(t, tt.args, args)
		})
	}
}

func TestApplyPerformerSort(t *testing.T) {
	id := uuid.Must(uuid.NewV4())
	tests := []struct {
		name      string
		input     models.PerformerQueryInput
		fragments []string
		args      []any
	}{
		{"default", models.PerformerQueryInput{}, []string{"ORDER BY name ASC"}, nil},
		{"debut", models.PerformerQueryInput{Sort: models.PerformerSortEnumDebut}, []string{"MIN(date) as debut", "ORDER BY debut ASC NULLS LAST"}, nil},
		{"studio debut", models.PerformerQueryInput{Sort: models.PerformerSortEnumDebut, StudioID: &id}, []string{"ORDER BY debut ASC NULLS LAST"}, nil},
		{"last scene", models.PerformerQueryInput{Sort: models.PerformerSortEnumLastScene, Direction: models.SortDirectionEnumDesc}, []string{"MAX(date) as last_scene", "ORDER BY last_scene DESC NULLS LAST"}, nil},
		{"scene count", models.PerformerQueryInput{Sort: models.PerformerSortEnumSceneCount}, []string{"COUNT(*) as scene_count", "COALESCE(scene_count, 0) ASC"}, nil},
		{"shared count", models.PerformerQueryInput{Sort: models.PerformerSortEnumSharedSceneCount, PerformedWith: &id}, []string{"shared_scene_count", "COALESCE(shared_scene_count, 0) ASC"}, []any{&id}},
		{"popularity", models.PerformerQueryInput{Sort: models.PerformerSortEnumPopularity}, []string{"performer_popularity_all_time", "COALESCE(performer_popularity_all_time.user_count, 0) ASC"}, nil},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			q := (&Performer{}).applyPerformerSort(sq.Select("performers.id").From("performers").PlaceholderFormat(sq.Dollar), tt.input)
			sql, args, err := q.ToSql()
			require.NoError(t, err)
			for _, fragment := range tt.fragments {
				assert.Contains(t, sql, fragment)
			}
			assert.Equal(t, tt.args, args)
		})
	}
}
