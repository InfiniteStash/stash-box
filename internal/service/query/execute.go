package query

import (
	"context"
	"fmt"
	"github.com/gofrs/uuid"

	"github.com/jackc/pgx/v5"

	"github.com/stashapp/stash-box/internal/queries"
	qb "github.com/stashapp/stash-box/pkg/querybuilder"
)

func namedSQL(query *qb.Builder, queryName string) (string, []any) {
	sql, args := query.Sql()
	if queryName != "" {
		sql = fmt.Sprintf("-- name: %s\n%s", queryName, sql)
	}
	return sql, args
}

func ExecuteQuery[T any, M any](ctx context.Context, query *qb.Builder, db queries.DBTX, converter func(T) M, queryName string) ([]M, error) {
	sql, args := namedSQL(query, queryName)
	rows, err := db.Query(ctx, sql, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []M
	for rows.Next() {
		dbEntity, err := pgx.RowToStructByPos[T](rows)
		if err != nil {
			return nil, err
		}
		results = append(results, converter(dbEntity))
	}
	if err = rows.Err(); err != nil {
		return nil, err
	}
	return results, nil
}

func ExecuteCount(ctx context.Context, query *qb.Builder, db queries.DBTX, queryName string) (int, error) {
	sql, args := namedSQL(query, queryName)
	var count int64
	err := db.QueryRow(ctx, sql, args...).Scan(&count)
	return int(count), err
}

func ExecuteIDQuery(ctx context.Context, query *qb.Builder, db queries.DBTX, queryName string) ([]uuid.UUID, error) {
	sql, args := namedSQL(query, queryName)
	rows, err := db.Query(ctx, sql, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var ids []uuid.UUID
	for rows.Next() {
		var id uuid.UUID
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	if err = rows.Err(); err != nil {
		return nil, err
	}
	return ids, nil
}
