package models

import (
	"github.com/gofrs/uuid"
)

type SceneCredit struct {
	SceneID      uuid.UUID `json:"scene_id"`
	PerformerID  uuid.UUID `json:"performer_id"`
	CreditRoleID int32     `json:"credit_role_id"`
	As           *string   `json:"as"`
}

type CreditInput struct {
	PerformerID  uuid.UUID   `json:"performer_id"`
	CreditRoleID int32       `json:"credit_role_id"`
	As           *string     `json:"as"`
	TagIDs       []uuid.UUID `json:"tag_ids"`
}

// SceneCreditEdit represents a credit in an edit diff with tag information
type SceneCreditEdit struct {
	PerformerID  uuid.UUID   `json:"performer_id"`
	CreditRoleID int32       `json:"credit_role_id"`
	As           *string     `json:"as"`
	TagIDs       []uuid.UUID `json:"tag_ids"`
}
