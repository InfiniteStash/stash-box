package scene

import (
	"context"
	"fmt"
	"github.com/gofrs/uuid"
	"strings"

	qb "github.com/stashapp/stash-box/pkg/querybuilder"

	"github.com/stashapp/stash-box/internal/auth"
	"github.com/stashapp/stash-box/internal/models"
	queryhelper "github.com/stashapp/stash-box/internal/service/query"
	schema "github.com/stashapp/stash-box/internal/service/query/schema"
)

func (s *Scene) Query(ctx context.Context, input models.SceneQueryInput) ([]models.Scene, error) {
	return s.QueryForPerformer(ctx, input, nil)
}

func (s *Scene) QueryForPerformer(ctx context.Context, input models.SceneQueryInput, performerID *uuid.UUID) ([]models.Scene, error) {
	user := auth.GetCurrentUser(ctx)
	query, err := s.buildSceneQuery(input, performerID, user.ID, false)
	if err != nil {
		return nil, err
	}
	ids, err := queryhelper.ExecuteIDQuery(ctx, query, s.queries.DB(), "QueryScenes")
	if err != nil {
		return nil, err
	}
	scenePtrs, loadErrs := s.LoadIds(ctx, ids)
	for _, loadErr := range loadErrs {
		if loadErr != nil {
			return nil, loadErr
		}
	}
	scenes := make([]models.Scene, 0, len(scenePtrs))
	for _, scene := range scenePtrs {
		if scene != nil {
			scenes = append(scenes, *scene)
		}
	}
	return scenes, nil
}

func (s *Scene) QueryCount(ctx context.Context, input models.SceneQueryInput) (int, error) {
	return s.QueryCountForPerformer(ctx, input, nil)
}

func (s *Scene) QueryCountForPerformer(ctx context.Context, input models.SceneQueryInput, performerID *uuid.UUID) (int, error) {
	user := auth.GetCurrentUser(ctx)
	inner, err := s.buildSceneQuery(input, performerID, user.ID, true)
	if err != nil {
		return 0, err
	}
	return queryhelper.ExecuteCount(ctx, qb.Count(inner, "subquery"), s.queries.DB(), "QueryScenesCount")
}

func (s *Scene) buildSceneQuery(input models.SceneQueryInput, performerID *uuid.UUID, userID uuid.UUID, forCount bool) (*qb.Builder, error) {
	query := qb.Select(schema.Scenes.ID).From(schema.Scenes)
	if performerID != nil {
		criterion := &models.MultiIDCriterionInput{Modifier: models.CriterionModifierIncludes, Value: []uuid.UUID{*performerID}}
		if err := queryhelper.ApplyMultiIDCriterion(query, schema.Scenes.ID, schema.ScenePerformers.SceneID, schema.ScenePerformers.PerformerID, schema.ScenePerformers, criterion); err != nil {
			return query, err
		}
	}
	if input.URL != nil && *input.URL != "" {
		query.Join(schema.SceneUrls, schema.Scenes.ID.EQ(schema.SceneUrls.SceneID)).Where(schema.SceneUrls.URL.EQ(qb.String(*input.URL)))
	}
	if input.ParentStudio != nil {
		parentID, err := uuid.FromString(*input.ParentStudio)
		if err != nil {
			return query, fmt.Errorf("invalid parent studio id %q: %w", *input.ParentStudio, err)
		}
		query.Join(schema.Studios, schema.Scenes.StudioID.EQ(schema.Studios.ID)).Where(qb.OR(schema.Studios.ParentStudioID.EQ(qb.UUID(parentID)), schema.Studios.ID.EQ(qb.UUID(parentID))))
	}
	if input.Performers != nil && len(input.Performers.Value) > 0 {
		if err := queryhelper.ApplyMultiIDCriterion(query, schema.Scenes.ID, schema.ScenePerformers.SceneID, schema.ScenePerformers.PerformerID, schema.ScenePerformers, input.Performers); err != nil {
			return query, err
		}
	}
	if input.Tags != nil && len(input.Tags.Value) > 0 {
		if err := queryhelper.ApplyMultiIDCriterion(query, schema.Scenes.ID, schema.SceneTags.SceneID, schema.SceneTags.TagID, schema.SceneTags, input.Tags); err != nil {
			return query, err
		}
	}
	if input.Fingerprints != nil && len(input.Fingerprints.Value) > 0 {
		hashes := make([]qb.Expr[int64], len(input.Fingerprints.Value))
		for i, hash := range input.Fingerprints.Value {
			parsed, err := models.UnmarshalFingerprintHash(hash)
			if err != nil {
				return query, fmt.Errorf("invalid fingerprint hash %q: %w", hash, err)
			}
			hashes[i] = qb.Int64(parsed.Int64())
		}
		sfp, fp := schema.SceneFingerprints.AS("SFP"), schema.Fingerprints.AS("FP")
		sceneID := sfp.SceneID.AS("scene_id")
		sub := qb.Select(sceneID).From(sfp.INNER_JOIN(fp, sfp.FingerprintID.EQ(fp.ID))).Where(fp.Hash.IN(hashes...)).GroupBy(sfp.SceneID).Statement().AsTable("T")
		query.Join(sub, schema.Scenes.ID.EQ(sub.Column(sceneID)))
	}
	if input.HasFingerprintSubmissions != nil && *input.HasFingerprintSubmissions {
		sfp := schema.SceneFingerprints.AS("SFP")
		sceneID := sfp.SceneID.AS("scene_id")
		sub := qb.Select(sceneID).From(sfp).Where(sfp.UserID.EQ(qb.UUID(userID))).GroupBy(sfp.SceneID).Statement().AsTable("submitted")
		query.Join(sub, schema.Scenes.ID.EQ(sub.Column(sceneID)))
	}
	if input.Text != nil && *input.Text != "" {
		query.Join(schema.SceneSearch, schema.SceneSearch.SceneID.EQ(schema.Scenes.ID)).Where(qb.Raw[bool]("scene_search.scene_id @@@ paradedb.match(field => 'scene_title', value => ?, conjunction_mode => true)", *input.Text))
	}
	if input.Title != nil && *input.Title != "" {
		query.Where(queryhelper.ILike(schema.Scenes.Title, "%"+*input.Title+"%"))
	}
	if input.Code != nil {
		queryhelper.ApplyStringCriterion(query, schema.Scenes.Code, input.Code)
	}
	if input.Studios != nil && len(input.Studios.Value) > 0 {
		switch input.Studios.Modifier {
		case models.CriterionModifierEquals, models.CriterionModifierNotEquals, models.CriterionModifierIsNull, models.CriterionModifierNotNull, models.CriterionModifierIncludes, models.CriterionModifierExcludes:
		default:
			return query, fmt.Errorf("unsupported modifier %s for scenes.studio_id", input.Studios.Modifier)
		}
		queryhelper.ApplyIDCriterion(query, schema.Scenes.StudioID, &models.IDCriterionInput{Modifier: input.Studios.Modifier, Value: input.Studios.Value})
	}
	if input.Date != nil {
		switch input.Date.Modifier {
		case models.CriterionModifierEquals, models.CriterionModifierNotEquals, models.CriterionModifierGreaterThan, models.CriterionModifierLessThan, models.CriterionModifierIsNull, models.CriterionModifierNotNull:
		default:
			return query, fmt.Errorf("unsupported modifier %s for scenes.date", input.Date.Modifier)
		}
		queryhelper.ApplyDateCriterion(query, schema.Scenes.Date, input.Date)
	}
	if input.Favorites != nil {
		clauses, args := []string{}, []any{}
		if *input.Favorites == models.FavoriteFilterPerformer || *input.Favorites == models.FavoriteFilterAll {
			clauses = append(clauses, `(SELECT scene_id FROM performer_favorites PF JOIN scene_performers SP ON PF.performer_id = SP.performer_id WHERE PF.user_id = ?)`)
			args = append(args, userID)
		}
		if *input.Favorites == models.FavoriteFilterStudio || *input.Favorites == models.FavoriteFilterAll {
			clauses = append(clauses, `(SELECT S.id FROM studio_favorites SF JOIN scenes S ON SF.studio_id = S.studio_id WHERE SF.user_id = ?)`)
			args = append(args, userID)
		}
		if len(clauses) > 0 {
			query.Where(qb.Raw[bool]("scenes.id IN ("+strings.Join(clauses, " UNION ")+")", args...))
		}
	}
	query.Where(schema.Scenes.Deleted.EQ(qb.Bool(false)))
	s.applySceneSort(query, input, performerID, forCount)
	return query, nil
}

func sceneOrder(expression qb.Expression, direction string) qb.OrderByClause {
	if direction == "DESC" {
		return qb.Desc(expression)
	}
	return qb.Asc(expression)
}

func (s *Scene) applySceneSort(query *qb.Builder, input models.SceneQueryInput, performerID *uuid.UUID, forCount bool) {
	if forCount {
		return
	}
	dir := "ASC"
	if input.Direction != "" {
		dir = strings.ToUpper(input.Direction.String())
	}
	switch input.Sort {
	case models.SceneSortEnumPopularity:
		if input.Direction == "" {
			dir = "DESC"
		}
		query.LeftJoin(schema.ScenePopularityAllTime, schema.Scenes.ID.EQ(schema.ScenePopularityAllTime.SceneID)).OrderBy(sceneOrder(qb.Raw[any]("COALESCE(scene_popularity_all_time.user_count, 0)"), dir), sceneOrder(schema.Scenes.ID, dir))
	case models.SceneSortEnumTrending:
		if input.Direction == "" {
			dir = "DESC"
		}
		query.Join(schema.ScenePopularityTrending, schema.Scenes.ID.EQ(schema.ScenePopularityTrending.SceneID)).OrderBy(sceneOrder(schema.ScenePopularityTrending.TrendingCount, dir), sceneOrder(schema.ScenePopularityTrending.SceneID, dir))
	default:
		field := qb.Expression(schema.Scenes.Title)
		switch input.Sort {
		case models.SceneSortEnumDate:
			field = schema.Scenes.Date
		case models.SceneSortEnumDuration:
			field = schema.Scenes.Duration
		case models.SceneSortEnumCreatedAt:
			field = schema.Scenes.CreatedAt
		case models.SceneSortEnumUpdatedAt:
			field = schema.Scenes.UpdatedAt
		}
		primary := sceneOrder(field, dir)
		if input.Sort == models.SceneSortEnumDuration {
			primary = primary.NULLS_LAST()
		}
		secondary := qb.Expression(schema.Scenes.ID)
		if input.Sort == models.SceneSortEnumTitle || input.Sort == "" {
			secondary = schema.Scenes.Title
		}
		query.OrderBy(primary, sceneOrder(secondary, dir))
	}
	queryhelper.ApplyPagination(query, input.Page, input.PerPage)
}
