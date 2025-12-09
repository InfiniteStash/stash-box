-- Scene credit queries

-- name: CreateSceneCredit :one
INSERT INTO scene_credits (scene_id, performer_id, credit_role_id, "as")
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: CreateSceneCredits :copyfrom
INSERT INTO scene_credits (scene_id, performer_id, credit_role_id, "as")
VALUES ($1, $2, $3, $4);

-- name: DeleteSceneCredits :exec
DELETE FROM scene_credits WHERE scene_id = $1;

-- name: GetSceneCredits :many
SELECT * FROM scene_credits WHERE scene_id = $1;

-- name: GetSceneCreditsByRole :many
-- Get scene credits filtered by role
SELECT * FROM scene_credits WHERE scene_id = $1 AND credit_role_id = $2;

-- name: FindSceneCreditsByIds :many
-- Get credits for multiple scenes (for DataLoader)
SELECT *
FROM scene_credits
WHERE scene_id = ANY(sqlc.arg(scene_ids)::UUID[])
ORDER BY scene_id;

-- name: CreateSceneCreditTags :copyfrom
INSERT INTO scene_credit_tags (scene_credit_id, tag_id)
VALUES ($1, $2);

-- name: DeleteSceneCreditTags :exec
DELETE FROM scene_credit_tags
WHERE scene_credit_id = $1;

-- name: GetTagsForCredit :many
SELECT sqlc.embed(t)
FROM scene_credit_tags sct
JOIN tags t ON sct.tag_id = t.id
WHERE sct.scene_credit_id = $1
ORDER BY t.name ASC;

-- name: FindCreditTagsBySceneIds :many
-- Get all credit tags for multiple scenes (for DataLoader)
SELECT sc.scene_id, sc.performer_id, sc.credit_role_id, sqlc.embed(t)
FROM scene_credit_tags sct
JOIN scene_credits sc ON sct.scene_credit_id = sc.id
JOIN tags t ON sct.tag_id = t.id
WHERE sc.scene_id = ANY(sqlc.arg(scene_ids)::UUID[])
ORDER BY sc.scene_id, sc.performer_id, sc.credit_role_id, t.name;
