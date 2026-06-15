-- Scene credit queries

-- name: CreateSceneCredit :one
INSERT INTO scene_credits (scene_id, performer_id, credit_type_id, "as")
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: CreateSceneCredits :copyfrom
INSERT INTO scene_credits (scene_id, performer_id, credit_type_id, "as")
VALUES ($1, $2, $3, $4);

-- name: DeleteSceneCredits :exec
DELETE FROM scene_credits WHERE scene_id = $1;

-- name: GetSceneCredits :many
SELECT * FROM scene_credits WHERE scene_id = $1;

-- name: GetSceneCreditsByType :many
-- Get scene credits filtered by credit type
SELECT * FROM scene_credits WHERE scene_id = $1 AND credit_type_id = $2;

-- name: FindSceneCreditsByIds :many
-- Get credits for multiple scenes (for DataLoader)
SELECT *
FROM scene_credits
WHERE scene_id = ANY(sqlc.arg(scene_ids)::UUID[])
ORDER BY scene_id;

-- name: CreateSceneCreditAttributes :copyfrom
INSERT INTO scene_credit_attributes (scene_credit_id, credit_attribute_id)
VALUES ($1, $2);

-- name: DeleteSceneCreditAttributes :exec
DELETE FROM scene_credit_attributes
WHERE scene_credit_id = $1;

-- name: FindCreditAttributesBySceneCreditIds :many
-- Get attributes for multiple scene credits, keyed by scene_credit_id (for DataLoader)
SELECT sca.scene_credit_id, sqlc.embed(ca)
FROM scene_credit_attributes sca
JOIN credit_attributes ca ON sca.credit_attribute_id = ca.id
WHERE sca.scene_credit_id = ANY(sqlc.arg(scene_credit_ids)::INT[])
ORDER BY sca.scene_credit_id, ca.name;

-- name: GetCurrentCreditAttributesForEdit :many
-- Attributes of the edit's target scene credits, identified by credit content
-- (performer, credit type, alias) so merged credits can be matched without a credit id.
SELECT sc.performer_id, sc.credit_type_id, sc."as", sca.credit_attribute_id
FROM edits e
JOIN scene_edits se ON e.id = se.edit_id
JOIN scene_credits sc ON sc.scene_id = se.scene_id
JOIN scene_credit_attributes sca ON sca.scene_credit_id = sc.id
WHERE e.id = $1;
