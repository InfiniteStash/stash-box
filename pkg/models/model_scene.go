package models

import (
    "crypto/md5"
	"database/sql"
    "encoding/hex"
	"github.com/gofrs/uuid"

	"github.com/stashapp/stashdb/pkg/database"
)

const (
	sceneTable   = "scenes"
	sceneJoinKey = "scene_id"
)

var (
	sceneDBTable = database.NewTable(sceneTable, func() interface{} {
		return &Scene{}
	})

	sceneFingerprintTable = database.NewTableJoin(sceneTable, "scene_fingerprints", sceneJoinKey, func() interface{} {
		return &SceneFingerprint{}
	})

	sceneUrlTable = database.NewTableJoin(sceneTable, "scene_urls", sceneJoinKey, func() interface{} {
		return &SceneUrl{}
	})
)

type Scene struct {
	ID        uuid.UUID       `db:"id" json:"id"`
	Title     sql.NullString  `db:"title" json:"title"`
	Details   sql.NullString  `db:"details" json:"details"`
	URL       sql.NullString  `db:"url" json:"url"`
	Date      SQLiteDate      `db:"date" json:"date"`
	StudioID  uuid.NullUUID   `db:"studio_id,omitempty" json:"studio_id"`
	CreatedAt SQLiteTimestamp `db:"created_at" json:"created_at"`
	UpdatedAt SQLiteTimestamp `db:"updated_at" json:"updated_at"`
	Duration  sql.NullInt32   `db:"duration" json:"duration"`
	Director  sql.NullString  `db:"director" json:"director"`
}

func (Scene) GetTable() database.Table {
	return sceneDBTable
}

func (p Scene) GetID() uuid.UUID {
	return p.ID
}

type Scenes []*Scene

func (p Scenes) Each(fn func(interface{})) {
	for _, v := range p {
		fn(*v)
	}
}

func (p *Scenes) Add(o interface{}) {
	*p = append(*p, o.(*Scene))
}

type SceneFingerprint struct {
	SceneID   uuid.UUID     `db:"scene_id" json:"scene_id"`
	Hash      string        `db:"hash" json:"hash"`
	Algorithm string        `db:"algorithm" json:"algorithm"`
    Duration  int           `db:"duration" json:"duration"`
}

type SceneUrl struct {
	SceneID uuid.UUID     `db:"scene_id" json:"scene_id"`
	URL     string        `db:"url" json:"url"`
	Type    string        `db:"type" json:"type"`
	ImageID uuid.NullUUID `db:"id" json:"image_id"`
	Height  sql.NullInt32 `db:"height" json:"height"`
	Width   sql.NullInt32 `db:"width" json:"width"`
}

func (p *SceneUrl) ToURL() URL {
    url := URL{
		URL:  p.URL,
		Type: p.Type,
	}
    if p.ImageID.Valid && p.Height.Valid && p.Width.Valid {
        imageID := p.ImageID.UUID.String()
        height := int(p.Height.Int32)
        width := int(p.Width.Int32)

        if width > 1280 || height > 1280 {
            hasher := md5.New()
            hasher.Write([]byte(imageID + "-resized"))
            imageID = hex.EncodeToString(hasher.Sum(nil))
        }

        url.ImageID = &imageID
        url.Height = &height
        url.Width = &width
    }
    return url
}

type SceneUrls []*SceneUrl

func (p SceneUrls) Each(fn func(interface{})) {
	for _, v := range p {
		fn(*v)
	}
}

func (p *SceneUrls) Add(o interface{}) {
	*p = append(*p, o.(*SceneUrl))
}

func CreateSceneUrls(sceneId uuid.UUID, urls []*URLInput) SceneUrls {
	var ret SceneUrls

	for _, urlInput := range urls {
		ret = append(ret, &SceneUrl{
			SceneID: sceneId,
			URL:     urlInput.URL,
			Type:    urlInput.Type,
		})
	}

	return ret
}

func (p SceneFingerprint) ToFingerprint() *Fingerprint {
	return &Fingerprint{
		Algorithm: FingerprintAlgorithm(p.Algorithm),
		Hash:      p.Hash,
        Duration:  p.Duration,
	}
}

type SceneFingerprints []*SceneFingerprint

func (p SceneFingerprints) Each(fn func(interface{})) {
	for _, v := range p {
		fn(*v)
	}
}

func (p *SceneFingerprints) Add(o interface{}) {
	*p = append(*p, o.(*SceneFingerprint))
}

func (p SceneFingerprints) ToFingerprints() []*Fingerprint {
	var ret []*Fingerprint
	for _, v := range p {
		ret = append(ret, v.ToFingerprint())
	}

	return ret
}

func CreateSceneFingerprints(sceneID uuid.UUID, fingerprints []*FingerprintInput) SceneFingerprints {
	var ret SceneFingerprints

	for _, fingerprint := range fingerprints {
		ret = append(ret, &SceneFingerprint{
			SceneID:   sceneID,
			Hash:      fingerprint.Hash,
			Algorithm: fingerprint.Algorithm.String(),
            Duration:  fingerprint.Duration,
		})
	}

	return ret
}

func CreateSceneTags(sceneID uuid.UUID, tagIds []string) ScenesTags {
	var tagJoins ScenesTags
	for _, tid := range tagIds {
		tagID := uuid.FromStringOrNil(tid)
		tagJoin := &SceneTag{
			SceneID: sceneID,
			TagID:   tagID,
		}
		tagJoins = append(tagJoins, tagJoin)
	}

	return tagJoins
}

func CreateScenePerformers(sceneID uuid.UUID, appearances []*PerformerAppearanceInput) PerformersScenes {
	var performerJoins PerformersScenes
	for _, a := range appearances {
		performerID, _ := uuid.FromString(a.PerformerID)
		performerJoin := &PerformerScene{
			SceneID:     sceneID,
			PerformerID: performerID,
		}

		if a.As != nil {
			performerJoin.As = sql.NullString{Valid: true, String: *a.As}
		}

		performerJoins = append(performerJoins, performerJoin)
	}

	return performerJoins
}

func (p *Scene) IsEditTarget() {
}

func (p *Scene) setDate(date string) {
	p.Date = SQLiteDate{String: date, Valid: true}
}

func (p *Scene) CopyFromCreateInput(input SceneCreateInput) {
	CopyFull(p, input)

	if input.Date != nil {
		p.setDate(*input.Date)
	}
}

func (p *Scene) CopyFromUpdateInput(input SceneUpdateInput) {
	CopyFull(p, input)

	if input.Date != nil {
		p.setDate(*input.Date)
	}
}
