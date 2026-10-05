package edit

import (
	"encoding/json"
	"testing"

	sq "github.com/Masterminds/squirrel"
	"github.com/gofrs/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/stashapp/stash-box/internal/models"
)

func pointer[T any](v T) *T { return &v }

func editSQL(t *testing.T, input models.EditQueryInput, userID uuid.UUID, forCount bool) (string, []any, error) {
	t.Helper()
	q, err := (&Edit{}).buildEditQuery(sq.StatementBuilder.PlaceholderFormat(sq.Dollar), input, userID, forCount)
	if err != nil {
		return "", nil, err
	}
	sql, args, err := q.ToSql()
	return sql, args, err
}

func TestBuildEditQueryFilters(t *testing.T) {
	id := uuid.Must(uuid.NewV4())
	userID := uuid.Must(uuid.NewV4())
	jsonID, err := json.Marshal(id)
	require.NoError(t, err)
	tests := []struct {
		name      string
		input     models.EditQueryInput
		fragments []string
		args      []any
	}{
		{"base", models.EditQueryInput{}, []string{"SELECT edits.id FROM edits"}, nil},
		{"voted", models.EditQueryInput{Voted: pointer(models.UserVotedFilterEnumAccept)}, []string{"JOIN edit_votes", "edit_votes.user_id = $1", "edit_votes.vote = $2"}, []any{userID.String(), "ACCEPT"}},
		{"not voted", models.EditQueryInput{Voted: pointer(models.UserVotedFilterEnumNotVoted)}, []string{"NOT EXISTS", "user_id = $1"}, []any{userID}},
		{"target type", models.EditQueryInput{TargetType: pointer(models.TargetTypeEnumScene)}, []string{"target_type = $1"}, []any{"SCENE"}},
		{"scene target", models.EditQueryInput{TargetType: pointer(models.TargetTypeEnumScene), TargetID: &id}, []string{"scene_edits", "scene_id = $2"}, []any{string(jsonID), id}},
		{"performer target", models.EditQueryInput{TargetType: pointer(models.TargetTypeEnumPerformer), TargetID: &id}, []string{"performer_edits", "added_performers"}, []any{string(jsonID), id, string(jsonID)}},
		{"studio target", models.EditQueryInput{TargetType: pointer(models.TargetTypeEnumStudio), TargetID: &id}, []string{"studio_edits", "studio_id"}, []any{string(jsonID), id, string(jsonID)}},
		{"tag target", models.EditQueryInput{TargetType: pointer(models.TargetTypeEnumTag), TargetID: &id}, []string{"tag_edits", "added_tags"}, []any{string(jsonID), id, string(jsonID)}},
		{"favorite", models.EditQueryInput{IsFavorite: pointer(true)}, []string{"studio_favorites", "performer_favorites"}, []any{userID, userID, userID, userID, userID, userID}},
		{"false favorite ignored", models.EditQueryInput{IsFavorite: pointer(false)}, []string{"SELECT edits.id FROM edits"}, nil},
		{"user", models.EditQueryInput{UserID: &id}, []string{"edits.user_id = $1"}, []any{id.String()}},
		{"status", models.EditQueryInput{Status: pointer(models.VoteStatusEnumPending)}, []string{"status = $1"}, []any{"PENDING"}},
		{"operation", models.EditQueryInput{Operation: pointer(models.OperationEnumCreate)}, []string{"operation = $1"}, []any{"CREATE"}},
		{"applied", models.EditQueryInput{Applied: pointer(false)}, []string{"applied = $1"}, []any{false}},
		{"bot", models.EditQueryInput{IsBot: pointer(true)}, []string{"bot = $1"}, []any{true}},
		{"exclude own", models.EditQueryInput{IncludeUserSubmitted: pointer(false)}, []string{"edits.user_id <> $1"}, []any{userID.String()}},
		{"include own", models.EditQueryInput{IncludeUserSubmitted: pointer(true)}, []string{"SELECT edits.id FROM edits"}, nil},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			sql, args, err := editSQL(t, tt.input, userID, false)
			require.NoError(t, err)
			for _, fragment := range tt.fragments {
				assert.Contains(t, sql, fragment)
			}
			assert.Equal(t, tt.args, args)
		})
	}

	_, _, err = editSQL(t, models.EditQueryInput{TargetID: &id}, userID, false)
	require.ErrorContains(t, err, "TargetType is required")
	sql, _, err := editSQL(t, models.EditQueryInput{}, userID, true)
	require.NoError(t, err)
	assert.Contains(t, sql, "SELECT COUNT(*) FROM edits")
}

func TestApplyEditSort(t *testing.T) {
	tests := []struct {
		name  string
		input models.EditQueryInput
		want  string
	}{
		{"default", models.EditQueryInput{}, "ORDER BY edits.created_at DESC, edits.id DESC"},
		{"created ascending", models.EditQueryInput{Sort: models.EditSortEnumCreatedAt, Direction: models.SortDirectionEnumAsc}, "ORDER BY edits.created_at ASC, edits.id ASC"},
		{"updated", models.EditQueryInput{Sort: models.EditSortEnumUpdatedAt}, "ORDER BY COALESCE(edits.updated_at, edits.created_at) DESC"},
		{"closed", models.EditQueryInput{Sort: models.EditSortEnumClosedAt}, "ORDER BY COALESCE(edits.closed_at, edits.created_at) DESC"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			sql, _, err := applyEditSort(sq.Select("edits.id").From("edits"), tt.input).ToSql()
			require.NoError(t, err)
			assert.Contains(t, sql, tt.want)
		})
	}
}
