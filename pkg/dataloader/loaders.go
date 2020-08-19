package dataloader

import (
	"context"
	"net/http"
	"time"

	"github.com/stashapp/stashdb/pkg/models"
)

const loadersKey = "dataloaders"

type Loaders struct {
	PerformerById PerformerLoader
}

func Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := context.WithValue(r.Context(), loadersKey, &Loaders{
			PerformerById: PerformerLoader{
				maxBatch: 100,
				wait:     1 * time.Millisecond,
				fetch: func(ids []string) ([]*models.Performer, []error) {
					qb := models.NewPerformerQueryBuilder(nil)
					return qb.FindByIds(ids)
				},
			},
		})
		r = r.WithContext(ctx)
		next.ServeHTTP(w, r)
	})
}

func For(ctx context.Context) *Loaders {
	return ctx.Value(loadersKey).(*Loaders)
}
