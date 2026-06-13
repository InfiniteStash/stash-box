-- Credit type queries

-- name: CreateCreditType :one
INSERT INTO credit_types (name, description, created_at, updated_at)
VALUES ($1, $2, now(), now())
RETURNING *;

-- name: UpdateCreditType :one
UPDATE credit_types
SET name = $2, description = $3, updated_at = now()
WHERE id = $1
RETURNING *;

-- name: DeleteCreditType :exec
DELETE FROM credit_types WHERE id = $1;

-- name: FindCreditType :one
SELECT * FROM credit_types WHERE id = $1;

-- name: GetAllCreditTypes :many
SELECT * FROM credit_types ORDER BY id ASC;

-- name: CountCreditsForType :one
SELECT COUNT(*) FROM scene_credits WHERE credit_type_id = $1;

-- name: GetCreditTypesByPerformer :many
SELECT
    sqlc.embed(credit_types),
    COUNT(DISTINCT scenes.id) as scene_count
FROM credit_types
JOIN scene_credits SC ON credit_types.id = SC.credit_type_id
JOIN scenes ON SC.scene_id = scenes.id
WHERE SC.performer_id = $1 AND scenes.deleted = false
GROUP BY credit_types.id
ORDER BY credit_types.id ASC;
