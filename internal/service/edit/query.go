package edit

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/gofrs/uuid"
	"strings"

	qb "github.com/stashapp/stash-box/pkg/querybuilder"

	"github.com/stashapp/stash-box/internal/auth"
	"github.com/stashapp/stash-box/internal/models"
	queryhelper "github.com/stashapp/stash-box/internal/service/query"
	schema "github.com/stashapp/stash-box/internal/service/query/schema"
)

func (s *Edit) QueryCount(ctx context.Context, filter models.EditQueryInput) (int, error) {
	user := auth.GetCurrentUser(ctx)

	query, err := s.buildEditQuery(filter, user.ID, true)
	if err != nil {
		return 0, err
	}

	return queryhelper.ExecuteCount(ctx, query, s.queries.DB(), "QueryEditsCount")
}

func (s *Edit) QueryEdits(ctx context.Context, filter models.EditQueryInput) ([]models.Edit, error) {
	user := auth.GetCurrentUser(ctx)

	query, err := s.buildEditQuery(filter, user.ID, false)
	if err != nil {
		return nil, err
	}

	// Apply sort
	sortDir := "DESC"
	if filter.Direction != "" {
		sortDir = strings.ToUpper(filter.Direction.String())
	}
	sort := qb.Expression(schema.Edits.CreatedAt)
	switch filter.Sort {
	case models.EditSortEnumUpdatedAt:
		sort = schema.Edits.UpdatedAt.Coalesce(schema.Edits.CreatedAt)
	case models.EditSortEnumClosedAt:
		sort = schema.Edits.ClosedAt.Coalesce(schema.Edits.CreatedAt)
	}
	query.OrderBy(editOrder(sort, sortDir), editOrder(schema.Edits.ID, sortDir))

	// Apply pagination
	queryhelper.ApplyPagination(query, filter.Page, filter.PerPage)

	ids, err := queryhelper.ExecuteIDQuery(ctx, query, s.queries.DB(), "QueryEdits")
	if err != nil {
		return nil, err
	}

	editPtrs, loadErrs := s.LoadIds(ctx, ids)
	for _, loadErr := range loadErrs {
		if loadErr != nil {
			return nil, loadErr
		}
	}
	edits := make([]models.Edit, 0, len(editPtrs))
	for _, edit := range editPtrs {
		if edit != nil {
			edits = append(edits, *edit)
		}
	}

	return edits, nil
}

func editOrder(expression qb.Expression, direction string) qb.OrderByClause {
	if direction == "DESC" {
		return qb.Desc(expression)
	}
	return qb.Asc(expression)
}

func (s *Edit) buildEditQuery(filter models.EditQueryInput, userID uuid.UUID, forCount bool) (*qb.Builder, error) {
	projection := qb.Projection(schema.Edits.ID)
	if forCount {
		// No filter fans out rows, so DISTINCT would only add a sort of every
		// matching id. The one join, edit_votes, is unique per (edit, user).
		projection = qb.COUNT(qb.STAR)
	}
	query := qb.Select(projection).From(schema.Edits)

	// Filter by voted status
	if filter.Voted != nil && *filter.Voted != "" {
		switch *filter.Voted {
		case models.UserVotedFilterEnumNotVoted:
			query.Where(qb.Raw[bool]("NOT EXISTS (SELECT 1 FROM edit_votes WHERE edit_id = edits.id AND user_id = ?)", userID))
		default:
			query.Join(schema.EditVotes, schema.Edits.ID.EQ(schema.EditVotes.EditID)).
				Where(schema.EditVotes.UserID.EQ(qb.UUID(userID)), schema.EditVotes.Vote.EQ(qb.String(filter.Voted.String())))
		}
	}

	// Filter by target ID
	if filter.TargetID != nil {
		if filter.TargetType == nil || *filter.TargetType == "" {
			return query, errors.New("TargetType is required when TargetID filter is used")
		}

		jsonID, _ := json.Marshal(*filter.TargetID)
		targetType := strings.ToLower(filter.TargetType.String())

		switch *filter.TargetType {
		case models.TargetTypeEnumPerformer:
			subquery := fmt.Sprintf(`
				edits.id IN (
					SELECT id FROM edits E WHERE E.data->'merge_sources' @> ?
					UNION
					SELECT edit_id FROM %s_edits WHERE %s_id = ?
					UNION
					SELECT id FROM edits E
					WHERE jsonb_path_query_array(data, '$.new_data.added_performers[*].performer_id') @> ?
					AND E.status = 'PENDING' AND E.target_type = 'SCENE'
				)`, targetType, targetType)
			query.Where(qb.Raw[bool](subquery, string(jsonID), *filter.TargetID, string(jsonID)))
		case models.TargetTypeEnumStudio:
			subquery := fmt.Sprintf(`
				edits.id IN (
					SELECT id FROM edits E WHERE E.data->'merge_sources' @> ?
					UNION
					SELECT edit_id FROM %s_edits WHERE %s_id = ?
					UNION
					SELECT id FROM edits E
					WHERE E.status = 'PENDING' AND E.target_type = 'SCENE'
					AND E.data->'new_data'->'studio_id' @> ?
				)`, targetType, targetType)
			query.Where(qb.Raw[bool](subquery, string(jsonID), *filter.TargetID, string(jsonID)))
		case models.TargetTypeEnumTag:
			subquery := fmt.Sprintf(`
				edits.id IN (
					SELECT id FROM edits E WHERE E.data->'merge_sources' @> ?
					UNION
					SELECT edit_id FROM %s_edits WHERE %s_id = ?
					UNION
					SELECT id FROM edits E
					WHERE E.status = 'PENDING' AND E.target_type = 'SCENE'
					AND E.data->'new_data'->'added_tags' @> ?
				)`, targetType, targetType)
			query.Where(qb.Raw[bool](subquery, string(jsonID), *filter.TargetID, string(jsonID)))
		default:
			subquery := fmt.Sprintf(`
				edits.id IN (
					SELECT id FROM edits E WHERE E.data->'merge_sources' @> ?
					UNION
					SELECT edit_id FROM %s_edits WHERE %s_id = ?
				)`, targetType, targetType)
			query.Where(qb.Raw[bool](subquery, string(jsonID), *filter.TargetID))
		}
	} else if filter.TargetType != nil && *filter.TargetType != "" {
		query.Where(schema.Edits.TargetType.EQ(qb.String(filter.TargetType.String())))
	}

	// Filter by favorite status
	if filter.IsFavorite != nil && *filter.IsFavorite {
		favoriteClause := `
			edits.id IN (
				(SELECT TE.edit_id FROM studio_favorites TF JOIN studio_edits TE ON TF.studio_id = TE.studio_id WHERE TF.user_id = ?)
				UNION
				(SELECT PE.edit_id FROM performer_favorites PF JOIN performer_edits PE ON PF.performer_id = PE.performer_id WHERE PF.user_id = ?)
				UNION
				(SELECT SE.edit_id FROM studio_favorites TF JOIN scenes S ON TF.studio_id = S.studio_id JOIN scene_edits SE ON S.id = SE.scene_id WHERE TF.user_id = ?)
				UNION
				(SELECT E.id FROM performer_favorites PF JOIN edits E ON E.data->'merge_sources' @> to_jsonb(PF.performer_id::TEXT)
				 WHERE E.target_type = 'PERFORMER' AND E.operation = 'MERGE' AND PF.user_id = ?)
				UNION
				(SELECT E.id FROM performer_favorites PF JOIN edits E
				 ON jsonb_path_query_array(E.data, '$.new_data.added_performers[*].performer_id') @> to_jsonb(PF.performer_id::TEXT)
				 OR jsonb_path_query_array(E.data, '$.new_data.removed_performers[*].performer_id') @> to_jsonb(PF.performer_id::TEXT)
				 WHERE E.target_type = 'SCENE' AND PF.user_id = ?)
				UNION
				(SELECT E.id FROM studio_favorites TF JOIN edits E
				 ON data->'new_data'->>'studio_id' = TF.studio_id::TEXT OR data->'old_data'->>'studio_id' = TF.studio_id::TEXT
				 WHERE E.target_type = 'SCENE' AND TF.user_id = ?)
			)
		`
		query.Where(qb.Raw[bool](favoriteClause, userID, userID, userID, userID, userID, userID))
	}

	// Simple filters
	if filter.UserID != nil {
		query.Where(schema.Edits.UserID.EQ(qb.UUID(*filter.UserID)))
	}
	if filter.Status != nil {
		query.Where(schema.Edits.Status.EQ(qb.String(filter.Status.String())))
	}
	if filter.Operation != nil {
		query.Where(schema.Edits.Operation.EQ(qb.String(filter.Operation.String())))
	}
	if filter.Applied != nil {
		query.Where(schema.Edits.Applied.EQ(qb.Bool(*filter.Applied)))
	}
	if filter.IsBot != nil {
		query.Where(schema.Edits.Bot.EQ(qb.Bool(*filter.IsBot)))
	}
	if filter.IncludeUserSubmitted != nil && !*filter.IncludeUserSubmitted {
		query.Where(schema.Edits.UserID.NOT_EQ(qb.UUID(userID)))
	}

	return query, nil
}
