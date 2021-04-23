package edit

import (
	"errors"

	"github.com/gofrs/uuid"
	"github.com/jmoiron/sqlx"

	"github.com/stashapp/stash-box/pkg/manager/config"
	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/user"
	"github.com/stashapp/stash-box/pkg/utils"
)

func ApplyEdit(tx *sqlx.Tx, editID uuid.UUID) (*models.Edit, error) {
	eqb := models.NewEditQueryBuilder(tx)
	edit, err := eqb.Find(editID)
	if err != nil {
		return nil, err
	}
	if edit == nil {
		return nil, errors.New("Edit not found")
	}

	if edit.Applied {
		return nil, errors.New("Edit already applied")
	}

	var status models.VoteStatusEnum
	utils.ResolveEnumString(edit.Status, &status)
	if status != models.VoteStatusEnumPending {
		return nil, errors.New("Invalid vote status: " + edit.Status)
	}

	var operation models.OperationEnum
	utils.ResolveEnumString(edit.Operation, &operation)
	var targetType models.TargetTypeEnum
	utils.ResolveEnumString(edit.TargetType, &targetType)
	switch targetType {
	case models.TargetTypeEnumTag:
		tqb := models.NewTagQueryBuilder(tx)
		var tag *models.Tag = nil
		if operation != models.OperationEnumCreate {
			tagID, err := eqb.FindTagID(edit.ID)
			if err != nil {
				return nil, err
			}
			tag, err = tqb.Find(*tagID)
			if err != nil {
				return nil, err
			}
			if tag == nil {
				return nil, errors.New("Tag not found: " + tagID.String())
			}
		}
		newTag, err := tqb.ApplyEdit(*edit, operation, tag)
		if err != nil {
			_ = tx.Rollback()
			return nil, err
		}

		if operation == models.OperationEnumCreate {
			editTag := models.EditTag{
				EditID: edit.ID,
				TagID:  newTag.ID,
			}

			err = eqb.CreateEditTag(editTag)
			if err != nil {
				_ = tx.Rollback()
				return nil, err
			}
		}
	case models.TargetTypeEnumPerformer:
		pqb := models.NewPerformerQueryBuilder(tx)
		var performer *models.Performer = nil
		if operation != models.OperationEnumCreate {
			performerID, err := eqb.FindPerformerID(edit.ID)
			if err != nil {
				return nil, err
			}
			performer, err = pqb.Find(*performerID)
			if err != nil {
				return nil, err
			}
			if performer == nil {
				return nil, errors.New("Performer not found: " + performerID.String())
			}
		}
		newPerformer, err := pqb.ApplyEdit(*edit, operation, performer)
		if err != nil {
			_ = tx.Rollback()
			return nil, err
		}

		if operation == models.OperationEnumCreate {
			editPerformer := models.EditPerformer{
				EditID:      edit.ID,
				PerformerID: newPerformer.ID,
			}

			err = eqb.CreateEditPerformer(editPerformer)
			if err != nil {
				_ = tx.Rollback()
				return nil, err
			}
		}
	default:
		return nil, errors.New("Not implemented: " + edit.TargetType)
	}

	if err != nil {
		_ = tx.Rollback()
		return nil, err
	}

	edit.ImmediateAccept()
	updatedEdit, err := eqb.Update(*edit)

	if err != nil {
		_ = tx.Rollback()
		return nil, err
	}

	threshold := config.GetVotePromotionThreshold()

	if threshold != nil {
		user.PromoteUserVoteRights(tx, updatedEdit.UserID, *threshold)
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return updatedEdit, nil
}
