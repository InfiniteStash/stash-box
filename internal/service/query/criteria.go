package query

import (
	"fmt"
	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/internal/models"
	qb "github.com/stashapp/stash-box/pkg/querybuilder"
)

func UUIDs(values []uuid.UUID) []qb.Expr[uuid.UUID] {
	result := make([]qb.Expr[uuid.UUID], len(values))
	for i, value := range values {
		result[i] = qb.UUID(value)
	}
	return result
}

func ILike(column qb.Column[string], value string) qb.Expr[bool] {
	return qb.ILike(column, value)
}

func ApplyMultiIDCriterion(query *qb.Builder, mainID, joinFK, joinField qb.Column[uuid.UUID], joinTable qb.TableExpr, criterion *models.MultiIDCriterionInput) error {
	modifier := criterion.Modifier
	if modifier == models.CriterionModifierIncludesAll && len(criterion.Value) == 1 {
		modifier = models.CriterionModifierIncludes
	}
	subquery := qb.Select(qb.Raw[any]("1")).From(joinTable).Where(joinField.IN(UUIDs(criterion.Value)...), joinFK.EQ(mainID.Expr))
	switch modifier {
	case models.CriterionModifierIncludes:
		query.Where(qb.Exists(subquery))
	case models.CriterionModifierExcludes:
		query.Where(qb.NOT(qb.Exists(subquery)))
	case models.CriterionModifierIncludesAll:
		matchingID := joinFK.AS(joinFK.Name)
		matching := qb.Select(matchingID).From(joinTable).Where(joinField.IN(UUIDs(criterion.Value)...)).GroupBy(joinFK).Having(qb.CountAll().EQ(qb.Int64(int64(len(criterion.Value))))).As("multi_id_filter")
		query.Join(matching, mainID.EQ(matching.Column(matchingID)))
	default:
		return fmt.Errorf("unsupported modifier %s", criterion.Modifier)
	}
	return nil
}

func ApplyIDCriterion(query *qb.Builder, field qb.Column[uuid.UUID], criterion *models.IDCriterionInput) *qb.Builder {
	switch criterion.Modifier {
	case models.CriterionModifierEquals:
		if len(criterion.Value) > 0 {
			query.Where(field.EQ(qb.UUID(criterion.Value[0])))
		}
	case models.CriterionModifierNotEquals:
		if len(criterion.Value) > 0 {
			query.Where(field.NOT_EQ(qb.UUID(criterion.Value[0])))
		}
	case models.CriterionModifierIncludes:
		query.Where(field.IN(UUIDs(criterion.Value)...))
	case models.CriterionModifierExcludes:
		query.Where(qb.OR(field.IS_NULL(), field.NOT_IN(UUIDs(criterion.Value)...)))
	case models.CriterionModifierIsNull:
		query.Where(field.IS_NULL())
	case models.CriterionModifierNotNull:
		query.Where(field.IS_NOT_NULL())
	}
	return query
}

func ApplyIntCriterion(query *qb.Builder, field qb.Expr[int], criterion *models.IntCriterionInput) *qb.Builder {
	value := qb.Value(criterion.Value)
	switch criterion.Modifier {
	case models.CriterionModifierEquals:
		query.Where(field.EQ(value))
	case models.CriterionModifierNotEquals:
		query.Where(field.NOT_EQ(value))
	case models.CriterionModifierGreaterThan:
		query.Where(field.GT(value))
	case models.CriterionModifierLessThan:
		query.Where(field.LT(value))
	case models.CriterionModifierIsNull:
		query.Where(field.IS_NULL())
	case models.CriterionModifierNotNull:
		query.Where(field.IS_NOT_NULL())
	}
	return query
}

func ApplyStringCriterion(query *qb.Builder, column qb.Column[string], criterion *models.StringCriterionInput) *qb.Builder {
	field := column.Expr
	value := qb.String(criterion.Value)
	switch criterion.Modifier {
	case models.CriterionModifierEquals:
		query.Where(field.EQ(value))
	case models.CriterionModifierNotEquals:
		query.Where(field.NOT_EQ(value))
	case models.CriterionModifierIncludes:
		query.Where(qb.ILike(field, "%"+criterion.Value+"%"))
	case models.CriterionModifierIsNull:
		query.Where(field.IS_NULL())
	case models.CriterionModifierNotNull:
		query.Where(field.IS_NOT_NULL())
	}
	return query
}

func ApplyDateCriterion(query *qb.Builder, column qb.Column[string], criterion *models.DateCriterionInput) *qb.Builder {
	field := column.Expr
	value := qb.String(criterion.Value)
	switch criterion.Modifier {
	case models.CriterionModifierEquals:
		query.Where(field.EQ(value))
	case models.CriterionModifierNotEquals:
		query.Where(field.NOT_EQ(value))
	case models.CriterionModifierGreaterThan:
		query.Where(field.GT(value))
	case models.CriterionModifierLessThan:
		query.Where(field.LT(value))
	case models.CriterionModifierIsNull:
		query.Where(field.IS_NULL())
	case models.CriterionModifierNotNull:
		query.Where(field.IS_NOT_NULL())
	}
	return query
}
