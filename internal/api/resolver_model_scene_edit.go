package api

import (
	"context"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/dataloader"
	"github.com/stashapp/stash-box/internal/models"
)

type sceneEditResolver struct{ *Resolver }

// Context key for storing credit tag IDs during edit diff resolution
type creditTagsContextKey struct{}

// creditTagsMap maps a credit composite key to its tag IDs
type creditTagsMap map[string][]uuid.UUID

func creditKey(performerID uuid.UUID, roleID int32) string {
	return performerID.String() + "|" + string(rune(roleID))
}

func (r *sceneEditResolver) Studio(ctx context.Context, obj *models.SceneEdit) (*models.Studio, error) {
	if obj.StudioID == nil {
		return nil, nil
	}

	return dataloader.For(ctx).StudioByID.Load(*obj.StudioID)
}

func (r *sceneEditResolver) AddedTags(ctx context.Context, obj *models.SceneEdit) ([]models.Tag, error) {
	return tagList(ctx, obj.AddedTags)
}

func (r *sceneEditResolver) RemovedTags(ctx context.Context, obj *models.SceneEdit) ([]models.Tag, error) {
	return tagList(ctx, obj.RemovedTags)
}

func (r *sceneEditResolver) AddedImages(ctx context.Context, obj *models.SceneEdit) ([]models.Image, error) {
	return imageList(ctx, obj.AddedImages)
}

func (r *sceneEditResolver) RemovedImages(ctx context.Context, obj *models.SceneEdit) ([]models.Image, error) {
	return imageList(ctx, obj.RemovedImages)
}

func (r *sceneEditResolver) fingerprintList(ctx context.Context, fingerprints []models.FingerprintInput) ([]models.Fingerprint, error) {
	var ret []models.Fingerprint
	for _, fp := range fingerprints {
		rr := models.Fingerprint{
			Hash:      fp.Hash,
			Algorithm: fp.Algorithm,
			Duration:  fp.Duration,
		}
		ret = append(ret, rr)
	}

	return ret, nil
}

func (r *sceneEditResolver) AddedFingerprints(ctx context.Context, obj *models.SceneEdit) ([]models.Fingerprint, error) {
	return r.fingerprintList(ctx, obj.AddedFingerprints)
}

func (r *sceneEditResolver) RemovedFingerprints(ctx context.Context, obj *models.SceneEdit) ([]models.Fingerprint, error) {
	return r.fingerprintList(ctx, obj.RemovedFingerprints)
}

func (r *sceneEditResolver) Fingerprints(ctx context.Context, obj *models.SceneEdit) ([]models.Fingerprint, error) {
	var ret []models.Fingerprint
	for _, fp := range obj.AddedFingerprints {
		ret = append(ret, models.Fingerprint{
			Hash:          fp.Hash,
			Algorithm:     fp.Algorithm,
			Duration:      fp.Duration,
			Submissions:   0,
			UserSubmitted: true,
		})
	}

	return ret, nil
}

func (r *sceneEditResolver) Images(ctx context.Context, obj *models.SceneEdit) ([]models.Image, error) {
	return r.services.Edit().GetMergedImages(ctx, obj.EditID)
}

func (r *sceneEditResolver) Tags(ctx context.Context, obj *models.SceneEdit) ([]models.Tag, error) {
	return r.services.Edit().GetMergedTags(ctx, obj.EditID)
}

func (r *sceneEditResolver) Performers(ctx context.Context, obj *models.SceneEdit) ([]models.PerformerAppearance, error) {
	return r.services.Edit().GetMergedPerformers(ctx, obj.EditID)
}

func (r *sceneEditResolver) Urls(ctx context.Context, obj *models.SceneEdit) ([]models.URL, error) {
	return r.services.Edit().GetMergedURLs(ctx, obj.EditID)
}

func (r *sceneEditResolver) creditList(ctx context.Context, credits []models.CreditInput) ([]models.SceneCreditEdit, error) {
	var ret []models.SceneCreditEdit
	for _, c := range credits {
		ret = append(ret, models.SceneCreditEdit{
			PerformerID:  c.PerformerID,
			CreditRoleID: c.CreditRoleID,
			As:           c.As,
			TagIDs:       c.TagIDs, // Preserve tag IDs for edit diffs
		})
	}
	return ret, nil
}

func (r *sceneEditResolver) AddedCredits(ctx context.Context, obj *models.SceneEdit) ([]models.SceneCreditEdit, error) {
	return r.creditList(ctx, obj.AddedCredits)
}

func (r *sceneEditResolver) RemovedCredits(ctx context.Context, obj *models.SceneEdit) ([]models.SceneCreditEdit, error) {
	return r.creditList(ctx, obj.RemovedCredits)
}

func (r *sceneEditResolver) Credits(ctx context.Context, obj *models.SceneEdit) ([]models.SceneCredit, error) {
	return r.services.Edit().GetMergedCredits(ctx, obj.EditID)
}
