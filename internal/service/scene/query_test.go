package scene

import (
	"strconv"
	"testing"

	sq "github.com/Masterminds/squirrel"
	"github.com/gofrs/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/stashapp/stash-box/internal/models"
)

func ptr[T any](value T) *T { return &value }

func buildSceneSQL(t *testing.T, input models.SceneQueryInput, performerID *uuid.UUID, userID uuid.UUID, forCount bool) (string, []any, error) {
	t.Helper()
	query, err := (&Scene{}).buildSceneQuery(sq.StatementBuilder.PlaceholderFormat(sq.Dollar), input, performerID, userID, forCount)
	if err != nil {
		return "", nil, err
	}
	sql, args, err := query.ToSql()
	return sql, args, err
}

func TestBuildSceneQueryFilters(t *testing.T) {
	userID := uuid.Must(uuid.NewV4())
	filterID := uuid.Must(uuid.NewV4())
	tests := []struct {
		name      string
		input     models.SceneQueryInput
		performer *uuid.UUID
		wantSQL   []string
		wantArgs  []any
	}{
		{"performer scope", models.SceneQueryInput{}, &filterID, []string{"EXISTS (SELECT 1 FROM scene_performers", "performer_id IN ($1)"}, []any{filterID, false}},
		{"url", models.SceneQueryInput{URL: ptr("https://example.com")}, nil, []string{"JOIN scene_urls", "scene_urls.url = $1"}, []any{"https://example.com", false}},
		{"empty url ignored", models.SceneQueryInput{URL: ptr("")}, nil, []string{"scenes.deleted = $1"}, []any{false}},
		{"parent studio", models.SceneQueryInput{ParentStudio: ptr(filterID.String())}, nil, []string{"JOIN studios", "studios.parent_studio_id = $1", "studios.id = $2"}, []any{filterID.String(), filterID.String(), false}},
		{"performers", models.SceneQueryInput{Performers: &models.MultiIDCriterionInput{Modifier: models.CriterionModifierIncludes, Value: []uuid.UUID{filterID}}}, nil, []string{"EXISTS (SELECT 1 FROM scene_performers", "performer_id IN ($1)"}, []any{filterID, false}},
		{"tags", models.SceneQueryInput{Tags: &models.MultiIDCriterionInput{Modifier: models.CriterionModifierExcludes, Value: []uuid.UUID{filterID}}}, nil, []string{"NOT EXISTS (SELECT 1 FROM scene_tags", "tag_id IN ($1)"}, []any{filterID, false}},
		{"empty relation criteria ignored", models.SceneQueryInput{Tags: &models.MultiIDCriterionInput{Modifier: models.CriterionModifierIncludes}}, nil, []string{"scenes.deleted = $1"}, []any{false}},
		{"fingerprints", models.SceneQueryInput{Fingerprints: &models.MultiStringCriterionInput{Value: []string{"123", "456"}}}, nil, []string{"JOIN fingerprints", "FP.hash IN ($1,$2)"}, []any{int64(0x123), int64(0x456), false}},
		{"fingerprint submissions", models.SceneQueryInput{HasFingerprintSubmissions: ptr(true)}, nil, []string{"FROM scene_fingerprints", "WHERE user_id = $1"}, []any{userID, false}},
		{"false fingerprint submissions ignored", models.SceneQueryInput{HasFingerprintSubmissions: ptr(false)}, nil, []string{"scenes.deleted = $1"}, []any{false}},
		{"text", models.SceneQueryInput{Text: ptr("whole title")}, nil, []string{"JOIN scene_search", "paradedb.match"}, []any{"whole title", false}},
		{"title", models.SceneQueryInput{Title: ptr("partial")}, nil, []string{"scenes.title ILIKE $1"}, []any{"%partial%", false}},
		{"code", models.SceneQueryInput{Code: &models.StringCriterionInput{Modifier: models.CriterionModifierIncludes, Value: "ABC"}}, nil, []string{"scenes.code ILIKE $1"}, []any{"%ABC%", false}},
		{"studio equals", models.SceneQueryInput{Studios: &models.MultiIDCriterionInput{Modifier: models.CriterionModifierEquals, Value: []uuid.UUID{filterID}}}, nil, []string{"scenes.studio_id = $1"}, []any{filterID.String(), false}},
		{"studio excludes", models.SceneQueryInput{Studios: &models.MultiIDCriterionInput{Modifier: models.CriterionModifierExcludes, Value: []uuid.UUID{filterID}}}, nil, []string{"scenes.studio_id IS NULL", "scenes.studio_id NOT IN ($1)"}, []any{filterID, false}},
		{"date greater", models.SceneQueryInput{Date: &models.DateCriterionInput{Modifier: models.CriterionModifierGreaterThan, Value: "2024-01-02"}}, nil, []string{"scenes.date > $1"}, []any{"2024-01-02", false}},
		{"performer favorites", models.SceneQueryInput{Favorites: ptr(models.FavoriteFilterPerformer)}, nil, []string{"performer_favorites", "scene_performers"}, []any{userID, false}},
		{"studio favorites", models.SceneQueryInput{Favorites: ptr(models.FavoriteFilterStudio)}, nil, []string{"studio_favorites"}, []any{userID, false}},
		{"all favorites", models.SceneQueryInput{Favorites: ptr(models.FavoriteFilterAll)}, nil, []string{"performer_favorites", " UNION ", "studio_favorites"}, []any{userID, userID, false}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			sql, args, err := buildSceneSQL(t, tt.input, tt.performer, userID, true)
			require.NoError(t, err)
			for _, fragment := range tt.wantSQL {
				assert.Contains(t, sql, fragment)
			}
			assert.Equal(t, tt.wantArgs, args)
		})
	}
}

func TestBuildSceneQueryRejectsInvalidFilters(t *testing.T) {
	userID := uuid.Must(uuid.NewV4())
	filterID := uuid.Must(uuid.NewV4())
	tests := []struct {
		name    string
		input   models.SceneQueryInput
		wantErr string
	}{
		{"fingerprint", models.SceneQueryInput{Fingerprints: &models.MultiStringCriterionInput{Value: []string{"not-a-hash"}}}, "invalid fingerprint hash"},
		{"performer modifier", models.SceneQueryInput{Performers: &models.MultiIDCriterionInput{Modifier: models.CriterionModifierEquals, Value: []uuid.UUID{filterID}}}, "unsupported modifier"},
		{"tag modifier", models.SceneQueryInput{Tags: &models.MultiIDCriterionInput{Modifier: models.CriterionModifierEquals, Value: []uuid.UUID{filterID}}}, "unsupported modifier"},
		{"studio modifier", models.SceneQueryInput{Studios: &models.MultiIDCriterionInput{Modifier: models.CriterionModifierGreaterThan, Value: []uuid.UUID{filterID}}}, "unsupported modifier"},
		{"date modifier", models.SceneQueryInput{Date: &models.DateCriterionInput{Modifier: models.CriterionModifierIncludes, Value: "2024-01-02"}}, "unsupported modifier"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, _, err := buildSceneSQL(t, tt.input, nil, userID, true)
			require.ErrorContains(t, err, tt.wantErr)
		})
	}
}

func TestBuildSceneQuerySortsAndCount(t *testing.T) {
	userID := uuid.Must(uuid.NewV4())
	tests := []struct {
		name       string
		input      models.SceneQueryInput
		forCount   bool
		contains   []string
		notContain []string
	}{
		{"default", models.SceneQueryInput{}, false, []string{"ORDER BY scenes.title ASC, scenes.id ASC", "LIMIT 25 OFFSET 0"}, nil},
		{"duration descending", models.SceneQueryInput{Sort: models.SceneSortEnumDuration, Direction: models.SortDirectionEnumDesc, Page: 2, PerPage: 10}, false, []string{"ORDER BY scenes.duration DESC NULLS LAST, scenes.id DESC", "LIMIT 10 OFFSET 10"}, nil},
		{"popularity", models.SceneQueryInput{Sort: models.SceneSortEnumPopularity, Direction: models.SortDirectionEnumAsc}, false, []string{"LEFT JOIN scene_popularity_all_time", "ORDER BY COALESCE(scene_popularity_all_time.user_count, 0) ASC"}, nil},
		{"popularity count", models.SceneQueryInput{Sort: models.SceneSortEnumPopularity}, true, []string{"LEFT JOIN scene_popularity_all_time"}, []string{"ORDER BY", "LIMIT"}},
		{"optimized trending", models.SceneQueryInput{Sort: models.SceneSortEnumTrending, Page: 2, PerPage: 10}, false, []string{"FROM scene_popularity_trending", "LIMIT 10 OFFSET 10", "ORDER BY TRENDING.count DESC"}, nil},
		{"filtered trending", models.SceneQueryInput{Sort: models.SceneSortEnumTrending, Title: ptr("x"), Page: 2, PerPage: 10}, false, []string{"FROM scene_popularity_trending", "scenes.title ILIKE", "LIMIT 10 OFFSET 10"}, nil},
		{"trending count", models.SceneQueryInput{Sort: models.SceneSortEnumTrending}, true, []string{"FROM scene_popularity_trending"}, []string{"ORDER BY", "LIMIT"}},
		{"ordinary count", models.SceneQueryInput{Sort: models.SceneSortEnumDate}, true, []string{"scenes.deleted"}, []string{"ORDER BY", "LIMIT", "OFFSET"}},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			sql, _, err := buildSceneSQL(t, tt.input, nil, userID, tt.forCount)
			require.NoError(t, err)
			for _, fragment := range tt.contains {
				assert.Contains(t, sql, fragment)
			}
			for _, fragment := range tt.notContain {
				assert.NotContains(t, sql, fragment)
			}
		})
	}
}

func TestBuildSceneQueryUsesEveryArgument(t *testing.T) {
	userID := uuid.Must(uuid.NewV4())
	filterID := uuid.Must(uuid.NewV4())
	input := models.SceneQueryInput{
		URL:                       ptr("https://example.com"),
		ParentStudio:              ptr(filterID.String()),
		Performers:                &models.MultiIDCriterionInput{Modifier: models.CriterionModifierIncludes, Value: []uuid.UUID{filterID}},
		Tags:                      &models.MultiIDCriterionInput{Modifier: models.CriterionModifierIncludes, Value: []uuid.UUID{filterID}},
		Fingerprints:              &models.MultiStringCriterionInput{Value: []string{"123"}},
		HasFingerprintSubmissions: ptr(true),
		Text:                      ptr("search"),
		Title:                     ptr("title"),
		Code:                      &models.StringCriterionInput{Modifier: models.CriterionModifierEquals, Value: "code"},
		Studios:                   &models.MultiIDCriterionInput{Modifier: models.CriterionModifierIncludes, Value: []uuid.UUID{filterID}},
		Date:                      &models.DateCriterionInput{Modifier: models.CriterionModifierEquals, Value: "2024-01-02"},
		Favorites:                 ptr(models.FavoriteFilterAll),
	}
	sql, args, err := buildSceneSQL(t, input, &filterID, userID, true)
	require.NoError(t, err)
	for i := 1; i <= len(args); i++ {
		assert.Contains(t, sql, "$"+strconv.Itoa(i))
	}
}
