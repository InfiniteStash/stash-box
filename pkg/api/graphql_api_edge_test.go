//go:build integration
// +build integration

package api_test

import (
	"testing"

	"github.com/99designs/gqlgen/client"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/stashapp/stash-box/pkg/models"
)

// TestSceneWithPerformers tests creating a scene with performers
func TestSceneWithPerformers(t *testing.T) {
	c := &graphqlClient{
		Client: client.New(handler),
	}

	// Create a performer first
	performerName := "Scene Performer"
	performer, err := c.createPerformer(models.PerformerCreateInput{
		Name: performerName,
	})
	require.NoError(t, err)
	require.NotNil(t, performer)

	// Create a scene with the performer
	sceneTitle := "Scene With Performer"
	aliasName := "Performer Alias"
	
	sceneInput := models.SceneCreateInput{
		Title: &sceneTitle,
		Performers: []*models.PerformerAppearanceInput{
			{
				Performer: performer.ID,
				As:        &aliasName,
			},
		},
	}

	scene, err := c.createScene(sceneInput)
	require.NoError(t, err)
	require.NotNil(t, scene)
	require.Len(t, scene.Performers, 1)
	assert.Equal(t, performer.ID, scene.Performers[0].Performer.ID)
	assert.Equal(t, aliasName, *scene.Performers[0].As)

	// Clean up
	destroyInput := models.SceneDestroyInput{
		ID: scene.ID,
	}
	_, err = c.destroyScene(destroyInput)
	require.NoError(t, err)
}

// TestSceneWithStudioAndTags tests creating a scene with studio and tags
func TestSceneWithStudioAndTags(t *testing.T) {
	c := &graphqlClient{
		Client: client.New(handler),
	}

	// Create a studio
	studioName := "Test Studio for Scene"
	studio, err := c.createStudio(models.StudioCreateInput{
		Name: studioName,
	})
	require.NoError(t, err)
	require.NotNil(t, studio)

	// Create a tag
	tagName := "Test Tag for Scene"
	tag, err := c.createTag(models.TagCreateInput{
		Name: tagName,
	})
	require.NoError(t, err)
	require.NotNil(t, tag)

	// Create a scene with studio and tag
	sceneTitle := "Scene With Studio and Tag"
	sceneInput := models.SceneCreateInput{
		Title:  &sceneTitle,
		Studio: &studio.ID,
		Tags:   []string{tag.ID},
	}

	scene, err := c.createScene(sceneInput)
	require.NoError(t, err)
	require.NotNil(t, scene)
	assert.Equal(t, studio.ID, scene.Studio.ID)
	require.Len(t, scene.Tags, 1)
	assert.Equal(t, tag.ID, scene.Tags[0].ID)

	// Clean up
	destroyInput := models.SceneDestroyInput{
		ID: scene.ID,
	}
	_, err = c.destroyScene(destroyInput)
	require.NoError(t, err)
}

// TestPerformerQueryFilters tests querying performers with various filters
func TestPerformerQueryFilters(t *testing.T) {
	c := &graphqlClient{
		Client: client.New(handler),
	}

	// Create performers with different attributes
	performer1Name := "Filter Test Performer 1"
	gender1 := models.GenderEnumFemale.String()
	birthdate1 := "1990-01-01"
	
	performer1, err := c.createPerformer(models.PerformerCreateInput{
		Name:      performer1Name,
		Gender:    (*models.GenderEnum)(&gender1),
		Birthdate: &birthdate1,
	})
	require.NoError(t, err)
	require.NotNil(t, performer1)

	performer2Name := "Filter Test Performer 2"
	gender2 := models.GenderEnumMale.String()
	birthdate2 := "1985-05-05"
	
	performer2, err := c.createPerformer(models.PerformerCreateInput{
		Name:      performer2Name,
		Gender:    (*models.GenderEnum)(&gender2),
		Birthdate: &birthdate2,
	})
	require.NoError(t, err)
	require.NotNil(t, performer2)

	// Test filter by name
	nameFilter := "Filter Test"
	performers, err := c.queryPerformers(models.PerformerQueryInput{
		Name: &nameFilter,
	})
	require.NoError(t, err)
	assert.GreaterOrEqual(t, len(performers), 2)
	
	// Test filter by gender
	genderFilter := models.GenderFilterEnumFemale
	performers, err = c.queryPerformers(models.PerformerQueryInput{
		Gender: &genderFilter,
	})
	require.NoError(t, err)
	
	foundPerformer1 := false
	for _, p := range performers {
		if p.ID == performer1.ID {
			foundPerformer1 = true
			break
		}
	}
	assert.True(t, foundPerformer1, "Should find performer1 when filtering by female gender")

	// Test filter by birth year
	birthYear := 1990
	performers, err = c.queryPerformers(models.PerformerQueryInput{
		BirthYear: &birthYear,
	})
	require.NoError(t, err)
	
	foundPerformer1 = false
	for _, p := range performers {
		if p.ID == performer1.ID {
			foundPerformer1 = true
			break
		}
	}
	assert.True(t, foundPerformer1, "Should find performer1 when filtering by birth year 1990")
}

// TestErrorHandling tests error cases in the GraphQL API
func TestErrorHandling(t *testing.T) {
	c := &graphqlClient{
		Client: client.New(handler),
	}

	// Test finding a non-existent scene
	nonExistentID := "00000000-0000-0000-0000-000000000000"
	_, err := c.findScene(uuid.FromStringOrNil(nonExistentID))
	assert.Error(t, err, "Finding non-existent scene should return an error")

	// Test creating a performer with invalid data
	invalidGender := "invalid_gender"
	_, err = c.createPerformer(models.PerformerCreateInput{
		Name:   "Invalid Performer",
		Gender: (*models.GenderEnum)(&invalidGender),
	})
	assert.Error(t, err, "Creating performer with invalid gender should return an error")

	// Test updating a scene with invalid data
	_, err = c.updateScene(models.SceneUpdateInput{
		ID: nonExistentID,
	})
	assert.Error(t, err, "Updating non-existent scene should return an error")
}
