package query

import (
	"testing"

	sq "github.com/Masterminds/squirrel"
	"github.com/gofrs/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/stashapp/stash-box/internal/models"
)

func renderCriterion(t *testing.T, query sq.SelectBuilder) (string, []any) {
	t.Helper()
	sql, args, err := query.PlaceholderFormat(sq.Dollar).ToSql()
	require.NoError(t, err)
	return sql, args
}

func TestApplyMultiIDCriterion(t *testing.T) {
	id1 := uuid.Must(uuid.NewV4())
	id2 := uuid.Must(uuid.NewV4())
	tests := []struct {
		name      string
		criterion models.MultiIDCriterionInput
		wantSQL   string
		wantArgs  []any
		wantErr   string
	}{
		{"includes", models.MultiIDCriterionInput{Modifier: models.CriterionModifierIncludes, Value: []uuid.UUID{id1, id2}}, "EXISTS (SELECT 1 FROM scene_tags", []any{id1, id2}, ""},
		{"single includes all collapses to includes", models.MultiIDCriterionInput{Modifier: models.CriterionModifierIncludesAll, Value: []uuid.UUID{id1}}, "EXISTS (SELECT 1 FROM scene_tags", []any{id1}, ""},
		{"multiple includes all", models.MultiIDCriterionInput{Modifier: models.CriterionModifierIncludesAll, Value: []uuid.UUID{id1, id2}}, "INNER JOIN (SELECT scene_id FROM scene_tags", []any{id1, id2, 2}, ""},
		{"excludes", models.MultiIDCriterionInput{Modifier: models.CriterionModifierExcludes, Value: []uuid.UUID{id1}}, "NOT EXISTS (SELECT 1 FROM scene_tags", []any{id1}, ""},
		{"unsupported", models.MultiIDCriterionInput{Modifier: models.CriterionModifierEquals, Value: []uuid.UUID{id1}}, "", nil, "unsupported modifier EQUALS"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			query := sq.Select("scenes.id").From("scenes")
			err := ApplyMultiIDCriterion(&query, "scenes", "scene_tags", "scene_id", "tag_id", &tt.criterion)
			if tt.wantErr != "" {
				require.ErrorContains(t, err, tt.wantErr)
				return
			}
			require.NoError(t, err)
			sql, args := renderCriterion(t, query)
			assert.Contains(t, sql, tt.wantSQL)
			assert.Equal(t, tt.wantArgs, args)
		})
	}
}

func TestApplyIDCriterion(t *testing.T) {
	id1 := uuid.Must(uuid.NewV4())
	id2 := uuid.Must(uuid.NewV4())
	tests := []struct {
		name     string
		modifier models.CriterionModifier
		values   []uuid.UUID
		wantSQL  string
		wantArgs []any
	}{
		{"equals", models.CriterionModifierEquals, []uuid.UUID{id1}, "studio_id = $1", []any{id1.String()}},
		{"empty equals is ignored", models.CriterionModifierEquals, nil, "WHERE", nil},
		{"not equals", models.CriterionModifierNotEquals, []uuid.UUID{id1}, "studio_id <> $1", []any{id1.String()}},
		{"empty not equals is ignored", models.CriterionModifierNotEquals, nil, "WHERE", nil},
		{"includes", models.CriterionModifierIncludes, []uuid.UUID{id1, id2}, "studio_id IN ($1,$2)", []any{id1, id2}},
		{"excludes", models.CriterionModifierExcludes, []uuid.UUID{id1, id2}, "studio_id IS NULL OR studio_id NOT IN ($1,$2)", []any{id1, id2}},
		{"is null", models.CriterionModifierIsNull, nil, "studio_id IS NULL", nil},
		{"not null", models.CriterionModifierNotNull, nil, "studio_id IS NOT NULL", nil},
		{"unsupported is ignored", models.CriterionModifierGreaterThan, []uuid.UUID{id1}, "WHERE", nil},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			base := sq.Select("id").From("scenes")
			query := ApplyIDCriterion(base, "studio_id", &models.IDCriterionInput{Modifier: tt.modifier, Value: tt.values})
			sql, args := renderCriterion(t, query)
			if tt.wantSQL == "WHERE" {
				assert.NotContains(t, sql, " WHERE ")
			} else {
				assert.Contains(t, sql, tt.wantSQL)
			}
			assert.Equal(t, tt.wantArgs, args)
		})
	}
}

func TestScalarCriteria(t *testing.T) {
	t.Run("integer modifiers", func(t *testing.T) {
		cases := []struct {
			modifier models.CriterionModifier
			want     string
			args     []any
		}{
			{models.CriterionModifierEquals, "age = $1", []any{30}},
			{models.CriterionModifierNotEquals, "age <> $1", []any{30}},
			{models.CriterionModifierGreaterThan, "age > $1", []any{30}},
			{models.CriterionModifierLessThan, "age < $1", []any{30}},
			{models.CriterionModifierIsNull, "age IS NULL", nil},
			{models.CriterionModifierNotNull, "age IS NOT NULL", nil},
		}
		for _, tc := range cases {
			query := ApplyIntCriterion(sq.Select("id").From("performers"), "age", &models.IntCriterionInput{Modifier: tc.modifier, Value: 30})
			sql, args := renderCriterion(t, query)
			assert.Contains(t, sql, tc.want)
			assert.Equal(t, tc.args, args)
		}
		base := sq.Select("id").From("performers")
		sql, _ := renderCriterion(t, ApplyIntCriterion(base, "age", &models.IntCriterionInput{Modifier: models.CriterionModifierIncludes}))
		assert.NotContains(t, sql, " WHERE ")
	})

	t.Run("string modifiers", func(t *testing.T) {
		cases := []struct {
			modifier models.CriterionModifier
			want     string
			args     []any
		}{
			{models.CriterionModifierEquals, "code = $1", []any{"abc"}},
			{models.CriterionModifierNotEquals, "code <> $1", []any{"abc"}},
			{models.CriterionModifierIncludes, "code ILIKE $1", []any{"%abc%"}},
			{models.CriterionModifierIsNull, "code IS NULL", nil},
			{models.CriterionModifierNotNull, "code IS NOT NULL", nil},
		}
		for _, tc := range cases {
			query := ApplyStringCriterion(sq.Select("id").From("scenes"), "code", &models.StringCriterionInput{Modifier: tc.modifier, Value: "abc"})
			sql, args := renderCriterion(t, query)
			assert.Contains(t, sql, tc.want)
			assert.Equal(t, tc.args, args)
		}
		base := sq.Select("id").From("scenes")
		sql, _ := renderCriterion(t, ApplyStringCriterion(base, "code", &models.StringCriterionInput{Modifier: models.CriterionModifierGreaterThan}))
		assert.NotContains(t, sql, " WHERE ")
	})

	t.Run("date modifiers", func(t *testing.T) {
		cases := []struct {
			modifier models.CriterionModifier
			want     string
			args     []any
		}{
			{models.CriterionModifierEquals, "date = $1", []any{"2024-01-02"}},
			{models.CriterionModifierNotEquals, "date <> $1", []any{"2024-01-02"}},
			{models.CriterionModifierGreaterThan, "date > $1", []any{"2024-01-02"}},
			{models.CriterionModifierLessThan, "date < $1", []any{"2024-01-02"}},
			{models.CriterionModifierIsNull, "date IS NULL", nil},
			{models.CriterionModifierNotNull, "date IS NOT NULL", nil},
		}
		for _, tc := range cases {
			query := ApplyDateCriterion(sq.Select("id").From("scenes"), "date", &models.DateCriterionInput{Modifier: tc.modifier, Value: "2024-01-02"})
			sql, args := renderCriterion(t, query)
			assert.Contains(t, sql, tc.want)
			assert.Equal(t, tc.args, args)
		}
		base := sq.Select("id").From("scenes")
		sql, _ := renderCriterion(t, ApplyDateCriterion(base, "date", &models.DateCriterionInput{Modifier: models.CriterionModifierIncludes}))
		assert.NotContains(t, sql, " WHERE ")
	})
}
