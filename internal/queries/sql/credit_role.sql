-- Credit role queries

-- name: CreateCreditRole :one
INSERT INTO credit_roles (name, description, created_at, updated_at)
VALUES ($1, $2, now(), now())
RETURNING *;

-- name: UpdateCreditRole :one
UPDATE credit_roles
SET name = $2, description = $3, updated_at = now()
WHERE id = $1
RETURNING *;

-- name: DeleteCreditRole :exec
DELETE FROM credit_roles WHERE id = $1;

-- name: FindCreditRole :one
SELECT * FROM credit_roles WHERE id = $1;

-- name: GetAllCreditRoles :many
SELECT * FROM credit_roles ORDER BY id ASC;

-- name: CountCreditsForRole :one
SELECT COUNT(*) FROM scene_credits WHERE credit_role_id = $1;

-- name: CreateCreditRoleTag :exec
INSERT INTO credit_role_tags (credit_role_id, tag_id)
VALUES ($1, $2);

-- name: DeleteCreditRoleTag :exec
DELETE FROM credit_role_tags
WHERE credit_role_id = $1 AND tag_id = $2;

-- name: DeleteAllCreditRoleTags :exec
DELETE FROM credit_role_tags
WHERE credit_role_id = $1;

-- name: GetTagsForCreditRole :many
SELECT sqlc.embed(t)
FROM credit_role_tags ctt
JOIN tags t ON ctt.tag_id = t.id
WHERE ctt.credit_role_id = $1
ORDER BY t.name ASC;
