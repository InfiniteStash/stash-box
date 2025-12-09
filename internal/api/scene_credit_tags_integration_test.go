//go:build integration

package api_test

import (
	"fmt"
	"testing"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stretchr/testify/assert"
)

func TestSceneCreditTags(t *testing.T) {
	pt := createSceneEditTestRunner(t)

	// Create two tags
	tag1, err := pt.createTestTag(nil)
	assert.NoError(t, err)
	tag2, err := pt.createTestTag(nil)
	assert.NoError(t, err)

	// Associate tags with PERFORMANCE credit role (ID = 1)
	creditRoleID := 1
	var setTagsResp struct {
		CreditRoleSetTags struct {
			ID int
		}
	}

	pt.client.MustPost(fmt.Sprintf(`
		mutation {
			creditRoleSetTags(input: {
				role_id: %d
				tag_ids: ["%s", "%s"]
			}) {
				id
			}
		}
	`, creditRoleID, tag1.UUID(), tag2.UUID()), &setTagsResp)

	// Create a performer
	performer, err := pt.createTestPerformer(nil)
	assert.NoError(t, err)

	// Create a scene with a credit that has tags
	as := "Alias"
	sceneName := "Test Scene with Credit Tags"
	sceneInput := &models.SceneEditDetailsInput{
		Title: &sceneName,
		Credits: []models.CreditInput{
			{
				PerformerID:  performer.UUID(),
				CreditRoleID: int32(creditRoleID),
				As:           &as,
				TagIDs:       []uuid.UUID{tag1.UUID()},
			},
		},
	}

	// Create the scene via an edit
	edit, err := pt.createTestSceneEdit(models.OperationEnumCreate, sceneInput, nil)
	assert.NoError(t, err)

	// Apply the edit
	appliedEdit, err := pt.applyEdit(edit.ID)
	assert.NoError(t, err)

	// Get the created scene
	scene := pt.getEditSceneTarget(appliedEdit)

	// Query the scene credits with tags
	var queryResp struct {
		FindScene struct {
			Credits []struct {
				Performer struct {
					ID string
				}
				CreditRole struct {
					ID int
				} `json:"credit_role"`
				As   *string
				Tags []struct {
					ID   string
					Name string
				}
			}
		}
	}

	pt.client.MustPost(fmt.Sprintf(`
		query {
			findScene(id: "%s") {
				credits {
					performer { id }
					credit_role { id }
					as
					tags {
						id
						name
					}
				}
			}
		}
	`, scene.ID), &queryResp)

	// Verify the credit exists with the correct tag
	credits := queryResp.FindScene.Credits
	assert.Len(t, credits, 1, "Expected exactly one credit")
	assert.Equal(t, performer.UUID().String(), credits[0].Performer.ID)
	assert.Equal(t, creditRoleID, credits[0].CreditRole.ID)
	assert.NotNil(t, credits[0].As)
	assert.Equal(t, as, *credits[0].As)

	// Verify tags
	assert.Len(t, credits[0].Tags, 1, "Expected exactly one tag")
	assert.Equal(t, tag1.UUID().String(), credits[0].Tags[0].ID)

	t.Logf("✓ Scene created with credit tags successfully")

	// Now modify the scene to change the tags
	modifyInput := &models.SceneEditDetailsInput{
		Credits: []models.CreditInput{
			{
				PerformerID:  performer.UUID(),
				CreditRoleID: int32(creditRoleID),
				As:           &as,
				TagIDs:       []uuid.UUID{tag2.UUID()}, // Changed from tag1 to tag2
			},
		},
	}

	sceneID := scene.ID
	editInput := models.EditInput{
		Operation: models.OperationEnumModify,
		ID:        &sceneID,
	}

	modifyEdit, err := pt.createTestSceneEdit(models.OperationEnumModify, modifyInput, &editInput)
	assert.NoError(t, err)

	// Verify the edit diff shows tags in added_credits and removed_credits
	var editDiffResp struct {
		FindEdit struct {
			Details struct {
				AddedCredits []struct {
					Performer struct {
						ID string
					}
					CreditRole struct {
						ID int
					} `json:"credit_role"`
					As   *string
					Tags []struct {
						ID string
					}
				} `json:"added_credits"`
				RemovedCredits []struct {
					Performer struct {
						ID string
					}
					CreditRole struct {
						ID int
					} `json:"credit_role"`
					As   *string
					Tags []struct {
						ID string
					}
				} `json:"removed_credits"`
			}
		}
	}

	pt.client.MustPost(fmt.Sprintf(`
		query {
			findEdit(id: "%s") {
				details {
					... on SceneEdit {
						added_credits {
							performer { id }
							credit_role { id }
							as
							tags { id }
						}
						removed_credits {
							performer { id }
							credit_role { id }
							as
							tags { id }
						}
					}
				}
			}
		}
	`, modifyEdit.ID), &editDiffResp)

	// Verify added_credits shows tag2
	assert.Len(t, editDiffResp.FindEdit.Details.AddedCredits, 1, "Expected one added credit in edit diff")
	assert.Len(t, editDiffResp.FindEdit.Details.AddedCredits[0].Tags, 1, "Expected tag in added credit")
	assert.Equal(t, tag2.UUID().String(), editDiffResp.FindEdit.Details.AddedCredits[0].Tags[0].ID, "Added credit should show tag2")

	// Verify removed_credits shows tag1
	assert.Len(t, editDiffResp.FindEdit.Details.RemovedCredits, 1, "Expected one removed credit in edit diff")
	assert.Len(t, editDiffResp.FindEdit.Details.RemovedCredits[0].Tags, 1, "Expected tag in removed credit")
	assert.Equal(t, tag1.UUID().String(), editDiffResp.FindEdit.Details.RemovedCredits[0].Tags[0].ID, "Removed credit should show tag1")

	t.Logf("✓ Edit diff correctly shows tags in added_credits and removed_credits")

	// Apply the modification edit
	appliedModifyEdit, err := pt.applyEdit(modifyEdit.ID)
	assert.NoError(t, err)
	assert.NotNil(t, appliedModifyEdit)

	// Query the scene again to verify tags were updated
	pt.client.MustPost(fmt.Sprintf(`
		query {
			findScene(id: "%s") {
				credits {
					performer { id }
					credit_role { id }
					as
					tags {
						id
						name
					}
				}
			}
		}
	`, scene.ID), &queryResp)

	// Verify the credit now has tag2 instead of tag1
	credits = queryResp.FindScene.Credits
	assert.Len(t, credits, 1, "Expected exactly one credit after modification")
	assert.Len(t, credits[0].Tags, 1, "Expected exactly one tag after modification")
	assert.Equal(t, tag2.UUID().String(), credits[0].Tags[0].ID, "Tag should have been updated to tag2")

	t.Logf("✓ Scene credit tags updated successfully through edit")
}
