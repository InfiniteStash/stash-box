//go:build integration

package api_test

import (
	"testing"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stretchr/testify/assert"
)

type editCommentDeleteTestRunner struct {
	testRunner
}

func createEditCommentDeleteTestRunner(t *testing.T) *editCommentDeleteTestRunner {
	return &editCommentDeleteTestRunner{
		testRunner: *asModerate(t),
	}
}

func (s *editCommentDeleteTestRunner) addComment(editID uuid.UUID, text string) models.EditComment {
	_, err := s.resolver.Mutation().EditComment(s.ctx, models.EditCommentInput{
		ID:      editID,
		Comment: text,
	})
	assert.NoError(s.t, err)

	edit, err := s.resolver.Query().FindEdit(s.ctx, editID)
	assert.NoError(s.t, err)
	comments, err := s.resolver.Edit().Comments(s.ctx, edit)
	assert.NoError(s.t, err)
	assert.NotEmpty(s.t, comments)
	return comments[len(comments)-1]
}

func (s *editCommentDeleteTestRunner) testDeleteEditComment() {
	createdEdit, err := s.createTestTagEdit(models.OperationEnumCreate, nil, nil)
	assert.NoError(s.t, err)

	comment := s.addComment(createdEdit.ID, "Comment to delete")

	updated, err := s.resolver.Mutation().DeleteEditComment(s.ctx, models.DeleteEditCommentInput{
		ID:     comment.ID,
		Reason: "Removing test comment",
	})
	assert.NoError(s.t, err)
	assert.NotNil(s.t, updated)
	assert.Equal(s.t, createdEdit.ID, updated.ID)

	comments, err := s.resolver.Edit().Comments(s.ctx, updated)
	assert.NoError(s.t, err)
	for _, c := range comments {
		assert.NotEqual(s.t, comment.ID, c.ID)
	}
}

func (s *editCommentDeleteTestRunner) testNonModeratorCannotDeleteComment() {
	createdEdit, err := s.createTestTagEdit(models.OperationEnumCreate, nil, nil)
	assert.NoError(s.t, err)

	comment := s.addComment(createdEdit.ID, "Comment a non-mod tries to delete")

	editRunner := asEdit(s.t)
	_, err = editRunner.client.deleteEditComment(models.DeleteEditCommentInput{
		ID:     comment.ID,
		Reason: "should not be allowed",
	})
	assert.Error(s.t, err)
	assert.Contains(s.t, err.Error(), "not authorized")

	edit, err := s.resolver.Query().FindEdit(s.ctx, createdEdit.ID)
	assert.NoError(s.t, err)
	comments, err := s.resolver.Edit().Comments(s.ctx, edit)
	assert.NoError(s.t, err)
	found := false
	for _, c := range comments {
		if c.ID == comment.ID {
			found = true
			break
		}
	}
	assert.True(s.t, found, "comment should still exist")
}

func TestDeleteEditComment(t *testing.T) {
	s := createEditCommentDeleteTestRunner(t)
	s.testDeleteEditComment()
}

func TestNonModeratorCannotDeleteEditComment(t *testing.T) {
	s := createEditCommentDeleteTestRunner(t)
	s.testNonModeratorCannotDeleteComment()
}
