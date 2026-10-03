package performer

import (
	"context"
	"github.com/gofrs/uuid"
	"strings"

	qb "github.com/stashapp/stash-box/pkg/querybuilder"

	"github.com/stashapp/stash-box/internal/auth"
	"github.com/stashapp/stash-box/internal/models"
	queryhelper "github.com/stashapp/stash-box/internal/service/query"
	schema "github.com/stashapp/stash-box/internal/service/query/schema"
)

func (s *Performer) Query(ctx context.Context, input models.PerformerQueryInput) ([]models.Performer, error) {
	user := auth.GetCurrentUser(ctx)
	query := s.buildPerformerQuery(input, user.ID, false)
	s.applyPerformerSort(query, input)
	queryhelper.ApplyPagination(query, input.Page, input.PerPage)
	ids, err := queryhelper.ExecuteIDQuery(ctx, query, s.queries.DB(), "QueryPerformers")
	if err != nil {
		return nil, err
	}
	performerPtrs, loadErrs := s.LoadIds(ctx, ids)
	for _, loadErr := range loadErrs {
		if loadErr != nil {
			return nil, loadErr
		}
	}
	performers := make([]models.Performer, 0, len(performerPtrs))
	for _, performer := range performerPtrs {
		if performer != nil {
			performers = append(performers, *performer)
		}
	}
	return performers, nil
}

func (s *Performer) QueryCount(ctx context.Context, input models.PerformerQueryInput) (int, error) {
	user := auth.GetCurrentUser(ctx)
	return queryhelper.ExecuteCount(ctx, s.buildPerformerQuery(input, user.ID, true), s.queries.DB(), "QueryPerformersCount")
}

type performerStatsRelation struct {
	table       qb.DerivedTable
	performerID qb.Expr[uuid.UUID]
	debut       qb.Expr[string]
	lastScene   qb.Expr[string]
	sceneCount  qb.Expr[int64]
}

func performerStats(studioID *uuid.UUID, alias string) performerStatsRelation {
	sp := schema.ScenePerformers.AS(alias + "_sp")
	scenes := schema.Scenes.AS(alias + "_sc")
	performerID := sp.PerformerID.AS("performer_id")
	debut := qb.MIN(scenes.Date).AS("debut")
	lastScene := qb.MAX(scenes.Date).AS("last_scene")
	sceneCount := qb.CountAll().AS("scene_count")
	q := qb.Select(performerID, debut, lastScene, sceneCount).From(sp.INNER_JOIN(scenes, sp.SceneID.EQ(scenes.ID))).GroupBy(sp.PerformerID)
	if studioID != nil {
		q.Where(scenes.StudioID.EQ(qb.UUID(*studioID)))
	}
	table := q.As(alias)
	return performerStatsRelation{
		table: table, performerID: table.Column(performerID), debut: table.Column(debut),
		lastScene: table.Column(lastScene), sceneCount: table.Column(sceneCount),
	}
}

func (s *Performer) buildPerformerQuery(input models.PerformerQueryInput, userID uuid.UUID, forCount bool) *qb.Builder {
	projection := qb.Projection(schema.Performers.ID)
	if forCount {
		projection = qb.COUNT(qb.STAR)
	}
	query := qb.Select(projection).From(schema.Performers)
	if input.StudioID != nil {
		stats := performerStats(input.StudioID, "d")
		query.Join(stats.table, schema.Performers.ID.EQ(stats.performerID))
	}
	if input.URL != nil && *input.URL != "" {
		query.Join(schema.PerformerUrls, schema.Performers.ID.EQ(schema.PerformerUrls.PerformerID)).Where(schema.PerformerUrls.URL.EQ(qb.String(*input.URL)))
	}
	if input.Name != nil && *input.Name != "" {
		query.Where(queryhelper.ILike(schema.Performers.Name, "%"+*input.Name+"%"))
	}
	if input.Names != nil && *input.Names != "" {
		term := "%" + *input.Names + "%"
		query.Where(qb.OR(queryhelper.ILike(schema.Performers.Name, term), queryhelper.ILike(schema.Performers.Disambiguation, term)))
	}
	if input.BirthYear != nil {
		queryhelper.ApplyIntCriterion(query, qb.RawInt("EXTRACT(YEAR FROM to_date(performers.birthdate, 'YYYY-MM-DD'))::int"), input.BirthYear)
	}
	if input.Birthdate != nil {
		queryhelper.ApplyDateCriterion(query, schema.Performers.Birthdate, input.Birthdate)
	}
	if input.Deathdate != nil {
		queryhelper.ApplyDateCriterion(query, schema.Performers.Deathdate, input.Deathdate)
	}
	if input.Age != nil {
		queryhelper.ApplyIntCriterion(query, qb.RawInt("EXTRACT(YEAR FROM AGE(COALESCE(to_date(performers.deathdate, 'YYYY-MM-DD'), CURRENT_DATE), to_date(performers.birthdate, 'YYYY-MM-DD')))::int"), input.Age)
	}
	if input.Gender != nil && *input.Gender != "" {
		if *input.Gender == models.GenderFilterEnumUnknown {
			query.Where(schema.Performers.Gender.IS_NULL())
		} else {
			query.Where(schema.Performers.Gender.EQ(qb.String(input.Gender.String())))
		}
	}
	if input.Ethnicity != nil && *input.Ethnicity != "" {
		if *input.Ethnicity == models.EthnicityFilterEnumUnknown {
			query.Where(schema.Performers.Ethnicity.IS_NULL())
		} else {
			query.Where(schema.Performers.Ethnicity.EQ(qb.String(input.Ethnicity.String())))
		}
	}
	if input.IsFavorite != nil {
		favorite := schema.PerformerFavorites.AS("F")
		if *input.IsFavorite {
			query.Join(favorite, schema.Performers.ID.EQ(favorite.PerformerID)).Where(favorite.UserID.EQ(qb.UUID(userID)))
		} else {
			query.LeftJoin(favorite, qb.AND(schema.Performers.ID.EQ(favorite.PerformerID), favorite.UserID.EQ(qb.UUID(userID)))).Where(favorite.PerformerID.IS_NULL())
		}
	}
	if input.PerformedWith != nil {
		query.Where(qb.Raw[bool](`performers.id IN (SELECT SP.performer_id FROM scene_performers SP JOIN scene_performers SPP ON SP.scene_id = SPP.scene_id WHERE SPP.performer_id = ? AND SP.performer_id != ? GROUP BY SP.performer_id)`, *input.PerformedWith, *input.PerformedWith))
	}
	if input.Disambiguation != nil {
		queryhelper.ApplyStringCriterion(query, schema.Performers.Disambiguation, input.Disambiguation)
	}
	if input.Country != nil {
		queryhelper.ApplyStringCriterion(query, schema.Performers.Country, input.Country)
	}
	query.Where(schema.Performers.Deleted.EQ(qb.Bool(false)))
	return query
}

func direction(desc bool, exp qb.Expression) qb.OrderByClause {
	if desc {
		return qb.Desc(exp)
	}
	return qb.Asc(exp)
}

func (s *Performer) applyPerformerSort(query *qb.Builder, input models.PerformerQueryInput) {
	desc := strings.ToUpper(input.Direction.String()) == "DESC"
	nameOrder := direction(desc, schema.Performers.Name)
	needsStats := input.StudioID != nil
	switch input.Sort {
	case models.PerformerSortEnumDebut, models.PerformerSortEnumLastScene, models.PerformerSortEnumSceneCount:
		stats := performerStats(input.StudioID, "d")
		if !needsStats {
			query.LeftJoin(stats.table, schema.Performers.ID.EQ(stats.performerID))
		}
		expression := qb.Expression(stats.sceneCount.Coalesce(qb.Int64(0)))
		if input.Sort == models.PerformerSortEnumDebut {
			expression = stats.debut
		}
		if input.Sort == models.PerformerSortEnumLastScene {
			expression = stats.lastScene
		}
		query.OrderBy(direction(desc, expression).NULLS_LAST(), nameOrder)
	case models.PerformerSortEnumSharedSceneCount:
		if input.PerformedWith != nil {
			sp := schema.ScenePerformers.AS("shared_sp")
			partner := schema.ScenePerformers.AS("shared_partner")
			scenes := schema.Scenes.AS("shared_scene")
			performerID := sp.PerformerID.AS("performer_id")
			sharedSceneCount := qb.CountAll().AS("shared_scene_count")
			shared := qb.Select(performerID, sharedSceneCount).
				From(sp.INNER_JOIN(partner, qb.AND(partner.SceneID.EQ(sp.SceneID), partner.PerformerID.EQ(qb.UUID(*input.PerformedWith)))).
					INNER_JOIN(scenes, qb.AND(scenes.ID.EQ(sp.SceneID), scenes.Deleted.EQ(qb.Bool(false))))).
				GroupBy(sp.PerformerID).Statement().AsTable("ss")
			query.LeftJoin(shared, schema.Performers.ID.EQ(shared.Column(performerID)))
			query.OrderBy(direction(desc, shared.Column(sharedSceneCount).Coalesce(qb.Int64(0))), nameOrder)
		} else {
			stats := performerStats(input.StudioID, "d")
			query.OrderBy(direction(desc, stats.sceneCount.Coalesce(qb.Int64(0))), nameOrder)
		}
	case models.PerformerSortEnumPopularity:
		query.LeftJoin(schema.PerformerPopularityAllTime, schema.Performers.ID.EQ(schema.PerformerPopularityAllTime.PerformerID)).OrderBy(direction(desc, qb.Raw[any]("COALESCE(performer_popularity_all_time.user_count, 0)")), nameOrder)
	default:
		field := qb.Expression(schema.Performers.Name)
		switch input.Sort {
		case models.PerformerSortEnumBirthdate:
			field = schema.Performers.Birthdate
		case models.PerformerSortEnumDeathdate:
			field = schema.Performers.Deathdate
		case models.PerformerSortEnumCareerStartYear:
			field = schema.Performers.CareerStartYear
		case models.PerformerSortEnumCreatedAt:
			field = schema.Performers.CreatedAt
		case models.PerformerSortEnumUpdatedAt:
			field = schema.Performers.UpdatedAt
		}
		query.OrderBy(direction(desc, field))
	}
}
