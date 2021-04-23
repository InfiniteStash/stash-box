package api

import (
	"context"
	"errors"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/pkg/database"
	"github.com/stashapp/stash-box/pkg/manager/edit"
	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/utils"
)

func (r *mutationResolver) SceneEdit(ctx context.Context, input models.SceneEditInput) (*models.Edit, error) {
	panic("not implemented")
}
func (r *mutationResolver) StudioEdit(ctx context.Context, input models.StudioEditInput) (*models.Edit, error) {
	panic("not implemented")
}

func (r *mutationResolver) TagEdit(ctx context.Context, input models.TagEditInput) (*models.Edit, error) {
	if err := validateEdit(ctx); err != nil {
		return nil, err
	}

	// TODO - handle modification of existing edit

	UUID, err := uuid.NewV4()
	if err != nil {
		return nil, err
	}

	// create the edit
	currentUser := getCurrentUser(ctx)

	newEdit := models.NewEdit(UUID, currentUser, models.TargetTypeEnumTag, input.Edit)

	tx := database.DB.MustBeginTx(ctx, nil)

	if input.Edit.Operation == models.OperationEnumModify {
		err = edit.ModifyTagEdit(tx, newEdit, input, wasFieldIncludedFunc(ctx))

		if err != nil {
			_ = tx.Rollback()
			return nil, err
		}
	} else if input.Edit.Operation == models.OperationEnumMerge {
		err = edit.MergeTagEdit(tx, newEdit, input, wasFieldIncludedFunc(ctx))

		if err != nil {
			_ = tx.Rollback()
			return nil, err
		}
	} else if input.Edit.Operation == models.OperationEnumDestroy {
		err = edit.DestroyTagEdit(tx, newEdit, input, wasFieldIncludedFunc(ctx))

		if err != nil {
			_ = tx.Rollback()
			return nil, err
		}
	} else if input.Edit.Operation == models.OperationEnumCreate {
		err = edit.CreateTagEdit(tx, newEdit, input, wasFieldIncludedFunc(ctx))

		if err != nil {
			_ = tx.Rollback()
			return nil, err
		}
	} else {
		panic("not implemented")
	}

	// save the edit
	eqb := models.NewEditQueryBuilder(tx)

	created, err := eqb.Create(*newEdit)
	if err != nil {
		_ = tx.Rollback()
		return nil, err
	}

	if input.Edit.ID != nil {
		tagID, _ := uuid.FromString(*input.Edit.ID)

		editTag := models.EditTag{
			EditID: created.ID,
			TagID:  tagID,
		}

		err = eqb.CreateEditTag(editTag)
		if err != nil {
			_ = tx.Rollback()
			return nil, err
		}
	}

	if input.Edit.Comment != nil && len(*input.Edit.Comment) > 0 {
		commentID, _ := uuid.NewV4()
		comment := models.NewEditComment(commentID, currentUser, created, *input.Edit.Comment)
		if err := eqb.CreateComment(*comment); err != nil {
			return nil, err
		}
	}

	// Commit
	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return newEdit, nil
}

func (r *mutationResolver) PerformerEdit(ctx context.Context, input models.PerformerEditInput) (*models.Edit, error) {
	if err := validateEdit(ctx); err != nil {
		return nil, err
	}

	// TODO - handle modification of existing edit

	UUID, err := uuid.NewV4()
	if err != nil {
		return nil, err
	}

	// create the edit
	currentUser := getCurrentUser(ctx)

	newEdit := models.NewEdit(UUID, currentUser, models.TargetTypeEnumPerformer, input.Edit)

	tx := database.DB.MustBeginTx(ctx, nil)

	if input.Edit.Operation == models.OperationEnumModify {
		err = edit.ModifyPerformerEdit(tx, newEdit, input, wasFieldIncludedFunc(ctx))

		if err != nil {
			_ = tx.Rollback()
			return nil, err
		}
	} else if input.Edit.Operation == models.OperationEnumMerge {
		err = edit.MergePerformerEdit(tx, newEdit, input, wasFieldIncludedFunc(ctx))

		if err != nil {
			_ = tx.Rollback()
			return nil, err
		}
	} else if input.Edit.Operation == models.OperationEnumDestroy {
		err = edit.DestroyPerformerEdit(tx, newEdit, input, wasFieldIncludedFunc(ctx))

		if err != nil {
			_ = tx.Rollback()
			return nil, err
		}
	} else if input.Edit.Operation == models.OperationEnumCreate {
		err = edit.CreatePerformerEdit(tx, newEdit, input, wasFieldIncludedFunc(ctx))

		if err != nil {
			_ = tx.Rollback()
			return nil, err
		}
	} else {
		panic("not implemented")
	}

	// save the edit
	eqb := models.NewEditQueryBuilder(tx)

	created, err := eqb.Create(*newEdit)
	if err != nil {
		_ = tx.Rollback()
		return nil, err
	}

	if input.Edit.ID != nil {
		performerID, _ := uuid.FromString(*input.Edit.ID)

		editPerformer := models.EditPerformer{
			EditID:      created.ID,
			PerformerID: performerID,
		}

		err = eqb.CreateEditPerformer(editPerformer)
		if err != nil {
			_ = tx.Rollback()
			return nil, err
		}
	}

	if input.Edit.Comment != nil && len(*input.Edit.Comment) > 0 {
		commentID, _ := uuid.NewV4()
		comment := models.NewEditComment(commentID, currentUser, created, *input.Edit.Comment)
		if err := eqb.CreateComment(*comment); err != nil {
			return nil, err
		}
	}

	// Commit
	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return newEdit, nil
}

func (r *mutationResolver) EditVote(ctx context.Context, input models.EditVoteInput) (*models.Edit, error) {
	if err := validateEdit(ctx); err != nil {
		return nil, err
	}

	currentUser := getCurrentUser(ctx)
	tx := database.DB.MustBeginTx(ctx, nil)
	eqb := models.NewEditQueryBuilder(tx)

	editID, err := uuid.FromString(input.ID)
	if err != nil {
		return nil, err
	}
	edit, err := eqb.Find(editID)
	if err != nil {
		return nil, err
	}

	vote := models.NewEditVote(currentUser, edit, input.Vote)
	if err := eqb.CreateVote(*vote); err != nil {
		return nil, err
	}

	edit, err = eqb.Find(editID)
	if err != nil {
		return nil, err
	}

	if edit.VoteCount > config.GetVoteApplicationThreshold() {
		return edit.ApplyEdit(tx, editID)
	}

	// Commit
	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return edit, nil
}

func (r *mutationResolver) EditComment(ctx context.Context, input models.EditCommentInput) (*models.Edit, error) {
	if err := validateEdit(ctx); err != nil {
		return nil, err
	}

	currentUser := getCurrentUser(ctx)
	tx := database.DB.MustBeginTx(ctx, nil)
	eqb := models.NewEditQueryBuilder(tx)

	editID, err := uuid.FromString(input.ID)
	if err != nil {
		return nil, err
	}
	edit, err := eqb.Find(editID)
	if err != nil {
		return nil, err
	}

	commentID, _ := uuid.NewV4()
	comment := models.NewEditComment(commentID, currentUser, edit, input.Comment)
	if err := eqb.CreateComment(*comment); err != nil {
		return nil, err
	}

	// Commit
	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return edit, nil
}

func (r *mutationResolver) CancelEdit(ctx context.Context, input models.CancelEditInput) (*models.Edit, error) {
	if err := validateAdmin(ctx); err != nil {
		return nil, err
	}

	tx := database.DB.MustBeginTx(ctx, nil)

	editID, _ := uuid.FromString(input.ID)
	eqb := models.NewEditQueryBuilder(tx)
	edit, err := eqb.Find(editID)
	if err != nil {
		return nil, err
	}
	if edit == nil {
		return nil, errors.New("Edit not found")
	}

	var status models.VoteStatusEnum
	utils.ResolveEnumString(edit.Status, &status)
	if status != models.VoteStatusEnumPending {
		return nil, errors.New("Invalid vote status: " + edit.Status)
	}

	edit.ImmediateReject()
	updatedEdit, err := eqb.Update(*edit)

	if err != nil {
		_ = tx.Rollback()
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return updatedEdit, nil
}

func (r *mutationResolver) ApplyEdit(ctx context.Context, input models.ApplyEditInput) (*models.Edit, error) {
	if err := validateAdmin(ctx); err != nil {
		return nil, err
	}

	tx := database.DB.MustBeginTx(ctx, nil)
	editID, _ := uuid.FromString(input.ID)

	return edit.ApplyEdit(tx, editID)
}
