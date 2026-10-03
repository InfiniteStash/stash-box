package querybuilder_test

import (
	"github.com/gofrs/uuid"
	"testing"

	"github.com/stretchr/testify/require"

	schema "github.com/stashapp/stash-box/internal/service/query/schema"
	qb "github.com/stashapp/stash-box/pkg/querybuilder"
)

func TestTypedColumnsAndArguments(t *testing.T) {
	id, err := uuid.NewV4()
	require.NoError(t, err)
	query := qb.Select(schema.Scenes.ID).
		From(schema.Scenes).
		Where(schema.Scenes.ID.EQ(qb.UUID(id)), schema.Scenes.Title.EQ(qb.String("title"))).
		Limit(10).Offset(20)

	sql, args, err := query.SQL()
	require.NoError(t, err)
	require.Equal(t, `SELECT "scenes"."id" FROM "scenes" WHERE "scenes"."id" = $1 AND "scenes"."title" = $2 LIMIT $3 OFFSET $4`, sql)
	require.Equal(t, []any{id, "title", int64(10), int64(20)}, args)
}

func TestSubquerySharesPlaceholderSequence(t *testing.T) {
	subquery := qb.Select(schema.SceneTags.SceneID).
		From(schema.SceneTags).
		Where(schema.SceneTags.TagID.EQ(qb.UUID(uuid.Nil)))
	query := qb.Select(schema.Scenes.ID).
		From(schema.Scenes).
		Where(qb.Exists(subquery), qb.Raw[bool](`"scenes"."title" ILIKE ?`, "%term%"))

	sql, args, err := query.SQL()
	require.NoError(t, err)
	require.Contains(t, sql, `EXISTS (SELECT "scene_tags"."scene_id"`)
	require.Contains(t, sql, `"scene_tags"."tag_id" = $1`)
	require.Contains(t, sql, `"scenes"."title" ILIKE $2`)
	require.Equal(t, []any{uuid.Nil, "%term%"}, args)
}

func TestAliasesQualifyGeneratedColumns(t *testing.T) {
	scenes := schema.Scenes.AS("s")
	sql, _, err := qb.Select(scenes.ID).From(scenes).SQL()
	require.NoError(t, err)
	require.Equal(t, `SELECT "s"."id" FROM "scenes" AS "s"`, sql)
}

func TestTypedDerivedColumnsAndCoalesce(t *testing.T) {
	performerID := schema.ScenePerformers.PerformerID.AS("performer_id")
	sceneCount := qb.CountAll().AS("scene_count")
	stats := qb.Select(performerID, sceneCount).
		From(schema.ScenePerformers).
		GroupBy(schema.ScenePerformers.PerformerID).
		As("stats")

	query := qb.Select(schema.Performers.ID).
		From(schema.Performers).
		LeftJoin(stats, schema.Performers.ID.EQ(stats.Column(performerID))).
		OrderBy(stats.Column(sceneCount).Coalesce(qb.Int64(0)).DESC())

	sql, args, err := query.SQL()
	require.NoError(t, err)
	require.Contains(t, sql, `LEFT JOIN (SELECT "scene_performers"."performer_id" AS "performer_id", COUNT(*) AS "scene_count"`)
	require.Contains(t, sql, `ON "performers"."id" = "stats"."performer_id"`)
	require.Contains(t, sql, `ORDER BY COALESCE("stats"."scene_count", $1) DESC`)
	require.Equal(t, []any{int64(0)}, args)
}
