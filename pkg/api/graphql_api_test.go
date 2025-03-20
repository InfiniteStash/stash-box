//go:build integration
// +build integration

package api_test

import (
	"testing"

	"github.com/99designs/gqlgen/client"
	"github.com/gofrs/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/stashapp/stash-box/pkg/models"
)

// TestSceneOperations tests the full CRUD lifecycle of a scene
func TestSceneOperations(t *testing.T) {
	c := &graphqlClient{
		Client: client.New(handler),
	}

	// Create a scene
	title := "Test Scene"
	details := "Test scene details"
	date := "2023-01-01"
	duration := 3600
	director := "Test Director"
	code := "TEST-001"

	input := models.SceneCreateInput{
		Title:    &title,
		Details:  &details,
		Date:     &date,
		Duration: &duration,
		Director: &director,
		Code:     &code,
	}

	scene, err := c.createScene(input)
	require.NoError(t, err)
	require.NotNil(t, scene)
	assert.Equal(t, title, *scene.Title)
	assert.Equal(t, details, *scene.Details)
	assert.Equal(t, date, *scene.Date)
	assert.Equal(t, duration, *scene.Duration)
	assert.Equal(t, director, *scene.Director)
	assert.Equal(t, code, *scene.Code)

	// Find the scene by ID
	foundScene, err := c.findScene(scene.UUID())
	require.NoError(t, err)
	require.NotNil(t, foundScene)
	assert.Equal(t, scene.ID, foundScene.ID)

	// Update the scene
	newTitle := "Updated Test Scene"
	updateInput := models.SceneUpdateInput{
		ID:    scene.ID,
		Title: &newTitle,
	}

	updatedScene, err := c.updateScene(updateInput)
	require.NoError(t, err)
	require.NotNil(t, updatedScene)
	assert.Equal(t, newTitle, *updatedScene.Title)
	assert.Equal(t, details, *updatedScene.Details) // Other fields should remain unchanged

	// Query scenes
	queryInput := models.SceneQueryInput{
		Title: &newTitle,
	}
	queryResult, err := c.queryScenes(queryInput)
	require.NoError(t, err)
	require.NotNil(t, queryResult)
	assert.GreaterOrEqual(t, queryResult.Count, 1)
	found := false
	for _, s := range queryResult.Scenes {
		if s.ID == scene.ID {
			found = true
			break
		}
	}
	assert.True(t, found, "Updated scene should be found in query results")

	// Delete the scene
	destroyInput := models.SceneDestroyInput{
		ID: scene.ID,
	}
	destroyed, err := c.destroyScene(destroyInput)
	require.NoError(t, err)
	assert.True(t, destroyed)

	// Verify scene is deleted
	deletedScene, err := c.findScene(scene.UUID())
	require.NoError(t, err)
	require.NotNil(t, deletedScene)
	assert.True(t, deletedScene.Deleted)
}

// TestFingerprintOperations tests fingerprint submission and lookup
func TestFingerprintOperations(t *testing.T) {
	c := &graphqlClient{
		Client: client.New(handler),
	}

	// Create a scene with fingerprint
	title := "Fingerprint Test Scene"
	hash := "abcdef1234567890"
	algorithm := models.FingerprintAlgorithmMd5
	duration := 1800

	// Create scene first
	sceneInput := models.SceneCreateInput{
		Title: &title,
		Fingerprints: []*models.FingerprintInput{
			{
				Hash:      hash,
				Algorithm: algorithm,
				Duration:  duration,
			},
		},
	}

	scene, err := c.createScene(sceneInput)
	require.NoError(t, err)
	require.NotNil(t, scene)
	require.Len(t, scene.Fingerprints, 1)
	assert.Equal(t, hash, scene.Fingerprints[0].Hash)

	// Find scene by fingerprint
	fingerprintQuery := models.FingerprintQueryInput{
		Hash:      hash,
		Algorithm: algorithm,
	}
	scenes, err := c.findSceneByFingerprint(fingerprintQuery)
	require.NoError(t, err)
	require.NotEmpty(t, scenes)
	found := false
	for _, s := range scenes {
		if s.ID == scene.ID {
			found = true
			break
		}
	}
	assert.True(t, found, "Scene should be found by fingerprint")

	// Find scenes by fingerprints (array)
	scenesByFingerprints, err := c.findScenesByFingerprints([]string{hash})
	require.NoError(t, err)
	require.NotEmpty(t, scenesByFingerprints)
	found = false
	for _, s := range scenesByFingerprints {
		if s.ID == scene.ID {
			found = true
			break
		}
	}
	assert.True(t, found, "Scene should be found by fingerprints array")

	// Submit a new fingerprint
	newHash := "0987654321fedcba"
	fingerprintSubmission := models.FingerprintSubmission{
		SceneID:   scene.ID,
		Hash:      newHash,
		Algorithm: algorithm,
		Duration:  duration,
	}
	submitted, err := c.submitFingerprint(fingerprintSubmission)
	require.NoError(t, err)
	assert.True(t, submitted)

	// Clean up
	destroyInput := models.SceneDestroyInput{
		ID: scene.ID,
	}
	_, err = c.destroyScene(destroyInput)
	require.NoError(t, err)
}

// TestPerformerOperations tests performer creation and retrieval
func TestPerformerOperations(t *testing.T) {
	c := &graphqlClient{
		Client: client.New(handler),
	}

	// Create a performer
	name := "Test Performer"
	disambiguation := "Test disambiguation"
	gender := models.GenderEnumFemale.String()
	birthdate := "1990-01-01"
	ethnicity := models.EthnicityEnumCaucasian.String()
	country := "US"
	eyeColor := models.EyeColorEnumBlue.String()
	hairColor := models.HairColorEnumBlonde.String()
	var height int64 = 170
	cupSize := "D"
	var bandSize int = 34
	var waist int = 24
	var hip int = 36
	breastType := models.BreastTypeEnumNatural.String()
	var careerStartYear int64 = 2010
	var careerEndYear int64 = 2020

	input := models.PerformerCreateInput{
		Name:           name,
		Disambiguation: &disambiguation,
		Gender:         (*models.GenderEnum)(&gender),
		Birthdate:      &birthdate,
		Ethnicity:      (*models.EthnicityEnum)(&ethnicity),
		Country:        &country,
		EyeColor:       (*models.EyeColorEnum)(&eyeColor),
		HairColor:      (*models.HairColorEnum)(&hairColor),
		Height:         &height,
		Measurements: &models.MeasurementsInput{
			CupSize:  &cupSize,
			BandSize: &bandSize,
			Waist:    &waist,
			Hip:      &hip,
		},
		BreastType:      (*models.BreastTypeEnum)(&breastType),
		CareerStartYear: &careerStartYear,
		CareerEndYear:   &careerEndYear,
	}

	performer, err := c.createPerformer(input)
	require.NoError(t, err)
	require.NotNil(t, performer)
	assert.Equal(t, name, performer.Name)
	assert.Equal(t, disambiguation, *performer.Disambiguation)
	assert.Equal(t, gender, *performer.Gender)
	assert.Equal(t, birthdate, *performer.Birthdate)
	assert.Equal(t, ethnicity, *performer.Ethnicity)
	assert.Equal(t, country, *performer.Country)
	assert.Equal(t, eyeColor, *performer.EyeColor)
	assert.Equal(t, hairColor, *performer.HairColor)
	assert.Equal(t, height, *performer.Height)
	assert.Equal(t, cupSize, *performer.Measurements.CupSize)
	assert.Equal(t, bandSize, *performer.Measurements.BandSize)
	assert.Equal(t, waist, *performer.Measurements.Waist)
	assert.Equal(t, hip, *performer.Measurements.Hip)
	assert.Equal(t, breastType, *performer.BreastType)
	assert.Equal(t, careerStartYear, *performer.CareerStartYear)
	assert.Equal(t, careerEndYear, *performer.CareerEndYear)

	// Find the performer by ID
	foundPerformer, err := c.findPerformer(performer.UUID())
	require.NoError(t, err)
	require.NotNil(t, foundPerformer)
	assert.Equal(t, performer.ID, foundPerformer.ID)
	assert.Equal(t, name, foundPerformer.Name)
}

// TestStudioOperations tests studio creation
func TestStudioOperations(t *testing.T) {
	c := &graphqlClient{
		Client: client.New(handler),
	}

	// Create a studio
	name := "Test Studio"
	url := "https://teststudio.com"

	input := models.StudioCreateInput{
		Name: name,
		Urls: []*models.URLInput{
			{
				URL: url,
			},
		},
	}

	studio, err := c.createStudio(input)
	require.NoError(t, err)
	require.NotNil(t, studio)
	assert.Equal(t, name, studio.Name)
	require.Len(t, studio.Urls, 1)
	assert.Equal(t, url, studio.Urls[0].URL)
}

// TestTagOperations tests tag creation
func TestTagOperations(t *testing.T) {
	c := &graphqlClient{
		Client: client.New(handler),
	}

	// Create a tag
	name := "Test Tag"
	description := "Test tag description"
	aliases := []string{"test", "tag"}

	input := models.TagCreateInput{
		Name:        name,
		Description: &description,
		Aliases:     aliases,
	}

	tag, err := c.createTag(input)
	require.NoError(t, err)
	require.NotNil(t, tag)
	assert.Equal(t, name, tag.Name)
	assert.Equal(t, description, *tag.Description)
	assert.ElementsMatch(t, aliases, tag.Aliases)
}
