//go:build integration

package api_test

import (
	"fmt"
	"testing"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stretchr/testify/assert"
)

// createCreditAttribute creates a credit attribute applicable to the given credit type ids
// and returns its id.
func createCreditAttribute(pt *sceneEditTestRunner, name string, typeIDs []int) int {
	var createResp struct {
		CreditAttributeCreate struct {
			ID int
		}
	}
	pt.client.MustPost(fmt.Sprintf(`
		mutation {
			creditAttributeCreate(input: { name: "%s" }) {
				id
			}
		}
	`, name), &createResp)
	id := createResp.CreditAttributeCreate.ID

	typeList := ""
	for i, t := range typeIDs {
		if i > 0 {
			typeList += ", "
		}
		typeList += fmt.Sprintf("%d", t)
	}

	var setResp struct {
		CreditAttributeSetCreditTypes struct {
			ID int
		}
	}
	pt.client.MustPost(fmt.Sprintf(`
		mutation {
			creditAttributeSetCreditTypes(input: { attribute_id: %d, credit_type_ids: [%s] }) {
				id
			}
		}
	`, id, typeList), &setResp)

	return id
}

func TestSceneCreditAttributes(t *testing.T) {
	pt := createSceneEditTestRunner(t)

	const performerTypeID = 1 // Performer credit type

	// Create two attributes applicable to the Performer credit type.
	suffix := uuid.Must(uuid.NewV4()).String()[:8]
	attr1 := createCreditAttribute(pt, "Attr One "+suffix, []int{performerTypeID})
	attr2 := createCreditAttribute(pt, "Attr Two "+suffix, []int{performerTypeID})

	// Create a performer
	performer, err := pt.createTestPerformer(nil)
	assert.NoError(t, err)

	// Create a scene with a credit that has attr1
	as := "Alias"
	sceneName := "Test Scene with Credit Attributes"
	sceneInput := &models.SceneEditDetailsInput{
		Title: &sceneName,
		Credits: []models.CreditInput{
			{
				PerformerID:  performer.UUID(),
				CreditTypeID: int32(performerTypeID),
				As:           &as,
				AttributeIDs: []int32{int32(attr1)},
			},
		},
	}

	edit, err := pt.createTestSceneEdit(models.OperationEnumCreate, sceneInput, nil)
	assert.NoError(t, err)

	appliedEdit, err := pt.approveEdit(edit.ID)
	assert.NoError(t, err)

	scene := pt.getEditSceneTarget(appliedEdit)

	var queryResp struct {
		FindScene struct {
			Credits []struct {
				Performer struct {
					ID string
				}
				CreditType struct {
					ID int
				} `json:"credit_type"`
				As         *string
				Attributes []struct {
					ID   int
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
					credit_type { id }
					as
					attributes {
						id
						name
					}
				}
			}
		}
	`, scene.ID), &queryResp)

	credits := queryResp.FindScene.Credits
	assert.Len(t, credits, 1, "Expected exactly one credit")
	assert.Equal(t, performer.UUID().String(), credits[0].Performer.ID)
	assert.Equal(t, performerTypeID, credits[0].CreditType.ID)
	assert.NotNil(t, credits[0].As)
	assert.Equal(t, as, *credits[0].As)

	assert.Len(t, credits[0].Attributes, 1, "Expected exactly one attribute")
	assert.Equal(t, attr1, credits[0].Attributes[0].ID)

	t.Logf("✓ Scene created with credit attributes successfully")

	// Now modify the scene to change the attribute from attr1 to attr2.
	modifyInput := &models.SceneEditDetailsInput{
		Credits: []models.CreditInput{
			{
				PerformerID:  performer.UUID(),
				CreditTypeID: int32(performerTypeID),
				As:           &as,
				AttributeIDs: []int32{int32(attr2)},
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

	var editDiffResp struct {
		FindEdit struct {
			Details struct {
				AddedCredits []struct {
					Performer struct {
						ID string
					}
					CreditType struct {
						ID int
					} `json:"credit_type"`
					As         *string
					Attributes []struct {
						ID int
					}
				} `json:"added_credits"`
				RemovedCredits []struct {
					Performer struct {
						ID string
					}
					CreditType struct {
						ID int
					} `json:"credit_type"`
					As         *string
					Attributes []struct {
						ID int
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
							credit_type { id }
							as
							attributes { id }
						}
						removed_credits {
							performer { id }
							credit_type { id }
							as
							attributes { id }
						}
					}
				}
			}
		}
	`, modifyEdit.ID), &editDiffResp)

	assert.Len(t, editDiffResp.FindEdit.Details.AddedCredits, 1, "Expected one added credit in edit diff")
	assert.Len(t, editDiffResp.FindEdit.Details.AddedCredits[0].Attributes, 1, "Expected attribute in added credit")
	assert.Equal(t, attr2, editDiffResp.FindEdit.Details.AddedCredits[0].Attributes[0].ID, "Added credit should show attr2")

	assert.Len(t, editDiffResp.FindEdit.Details.RemovedCredits, 1, "Expected one removed credit in edit diff")
	assert.Len(t, editDiffResp.FindEdit.Details.RemovedCredits[0].Attributes, 1, "Expected attribute in removed credit")
	assert.Equal(t, attr1, editDiffResp.FindEdit.Details.RemovedCredits[0].Attributes[0].ID, "Removed credit should show attr1")

	t.Logf("✓ Edit diff correctly shows attributes in added_credits and removed_credits")

	appliedModifyEdit, err := pt.approveEdit(modifyEdit.ID)
	assert.NoError(t, err)
	assert.NotNil(t, appliedModifyEdit)

	pt.client.MustPost(fmt.Sprintf(`
		query {
			findScene(id: "%s") {
				credits {
					performer { id }
					credit_type { id }
					as
					attributes {
						id
						name
					}
				}
			}
		}
	`, scene.ID), &queryResp)

	credits = queryResp.FindScene.Credits
	assert.Len(t, credits, 1, "Expected exactly one credit after modification")
	assert.Len(t, credits[0].Attributes, 1, "Expected exactly one attribute after modification")
	assert.Equal(t, attr2, credits[0].Attributes[0].ID, "Attribute should have been updated to attr2")

	t.Logf("✓ Scene credit attributes updated successfully through edit")
}
