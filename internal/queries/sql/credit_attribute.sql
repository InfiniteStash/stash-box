-- Credit attribute queries

-- name: CreateCreditAttribute :one
INSERT INTO credit_attributes (name, description, created_at, updated_at)
VALUES ($1, $2, now(), now())
RETURNING *;

-- name: UpdateCreditAttribute :one
UPDATE credit_attributes
SET name = $2, description = $3, updated_at = now()
WHERE id = $1
RETURNING *;

-- name: DeleteCreditAttribute :exec
DELETE FROM credit_attributes WHERE id = $1;

-- name: FindCreditAttribute :one
SELECT * FROM credit_attributes WHERE id = $1;

-- name: GetAllCreditAttributes :many
SELECT * FROM credit_attributes ORDER BY name ASC;

-- name: CountCreditsUsingAttribute :one
SELECT COUNT(*) FROM scene_credit_attributes WHERE credit_attribute_id = $1;

-- name: CreateCreditAttributeType :exec
INSERT INTO credit_attribute_types (credit_attribute_id, credit_type_id)
VALUES ($1, $2);

-- name: DeleteAllCreditAttributeTypes :exec
DELETE FROM credit_attribute_types WHERE credit_attribute_id = $1;

-- name: GetCreditTypeIDsForAttribute :many
SELECT credit_type_id
FROM credit_attribute_types
WHERE credit_attribute_id = $1
ORDER BY credit_type_id ASC;

-- name: GetAllCreditAttributeTypes :many
SELECT credit_attribute_id, credit_type_id
FROM credit_attribute_types
ORDER BY credit_attribute_id, credit_type_id;

-- name: GetValidAttributeIDsForType :many
-- Of the given attribute ids, returns those applicable to the given credit type
SELECT credit_attribute_id
FROM credit_attribute_types
WHERE credit_attribute_id = ANY(sqlc.arg(attribute_ids)::INT[])
  AND credit_type_id = sqlc.arg(credit_type_id);
