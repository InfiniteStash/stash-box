package dataloader

import (
	"context"
	"net/http"
	"time"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stashdb/pkg/models"
)

const loadersKey = "dataloaders"

type Loaders struct {
	PerformerById PerformerLoader
	ImageById ImageLoader
	SceneImageIDsById SceneImageIDsLoader
	SceneAppearancesById SceneAppearancesLoader
  SceneUrlsById SceneUrlsLoader
}

func Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := context.WithValue(r.Context(), loadersKey, &Loaders{
			PerformerById: PerformerLoader{
				maxBatch: 100,
				wait:     1 * time.Millisecond,
				fetch: func(ids []uuid.UUID) ([]*models.Performer, []error) {
					qb := models.NewPerformerQueryBuilder(nil)
					return qb.FindByIds(ids)
				},
			},
			SceneImageIDsById: SceneImageIDsLoader{
				maxBatch: 100,
				wait:     1 * time.Millisecond,
				fetch: func(ids []uuid.UUID) ([][]uuid.UUID, []error) {
					qb := models.NewImageQueryBuilder(nil)
					return qb.FindIdsBySceneIds(ids)
				},
			},
			SceneAppearancesById: SceneAppearancesLoader{
				maxBatch: 100,
				wait:     1 * time.Millisecond,
				fetch: func(ids []uuid.UUID) ([]models.PerformersScenes, []error) {
					qb := models.NewSceneQueryBuilder(nil)
					return qb.GetAllAppearances(ids)
				},
			},
			SceneUrlsById: SceneUrlsLoader{
				maxBatch: 100,
				wait:     1 * time.Millisecond,
				fetch: func(ids []uuid.UUID) ([]models.SceneUrls, []error) {
					qb := models.NewSceneQueryBuilder(nil)
					return qb.GetAllUrls(ids)
				},
			},
			ImageById: ImageLoader{
				maxBatch: 1000,
				wait:     1 * time.Millisecond,
				fetch: func(ids []uuid.UUID) ([]*models.Image, []error) {
					qb := models.NewImageQueryBuilder(nil)
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
