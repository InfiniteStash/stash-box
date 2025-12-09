-- Migrate existing scene_performers to scene_credits with PERFORMANCE role (id = 1)
INSERT INTO "scene_credits" (scene_id, performer_id, credit_role_id, "as")
SELECT
  sp.scene_id,
  sp.performer_id,
  1,  -- PERFORMANCE credit role
  sp."as"
FROM scene_performers sp;

DROP TABLE scene_performers;
