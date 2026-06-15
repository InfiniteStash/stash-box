package models

import (
	"github.com/gofrs/uuid"
)

type SceneCredit struct {
	ID           int32     `json:"id"`
	SceneID      uuid.UUID `json:"scene_id"`
	PerformerID  uuid.UUID `json:"performer_id"`
	CreditTypeID int32     `json:"credit_type_id"`
	As           *string   `json:"as"`

	// AttributeIDs carries attributes for synthetic credits that have no row in
	// scene_credits (ID == 0), e.g. the merged credits of an edit. For persisted
	// credits (ID != 0) it is nil and attributes are loaded by ID instead.
	AttributeIDs []int32 `json:"-"`
}

type CreditInput struct {
	PerformerID  uuid.UUID `json:"performer_id"`
	CreditTypeID int32     `json:"credit_type_id"`
	As           *string   `json:"as"`
	AttributeIDs []int32   `json:"attribute_ids"`
}

// SceneCreditEdit represents a credit in an edit diff with attribute information
type SceneCreditEdit struct {
	PerformerID  uuid.UUID `json:"performer_id"`
	CreditTypeID int32     `json:"credit_type_id"`
	As           *string   `json:"as"`
	AttributeIDs []int32   `json:"attribute_ids"`
}
