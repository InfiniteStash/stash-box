-- Credit types: the kind of credit (Performer, Director, ...). Admin-managed.
CREATE TABLE "credit_types" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "description" TEXT,
  "created_at" TIMESTAMP NOT NULL,
  "updated_at" TIMESTAMP NOT NULL
);

INSERT INTO "credit_types" (name, description, created_at, updated_at) VALUES
  ('Performer', 'On-screen performance', NOW(), NOW()),
  ('Director', 'Scene director', NOW(), NOW());

-- Credit attributes: admin-managed qualifiers (e.g. Bottom, Uncredited) scoped to credit types.
CREATE TABLE "credit_attributes" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "description" TEXT,
  "created_at" TIMESTAMP NOT NULL,
  "updated_at" TIMESTAMP NOT NULL
);

-- Which credit types each attribute may be applied to.
CREATE TABLE "credit_attribute_types" (
  "credit_attribute_id" INTEGER NOT NULL,
  "credit_type_id" INTEGER NOT NULL,
  PRIMARY KEY("credit_attribute_id", "credit_type_id"),
  FOREIGN KEY("credit_attribute_id") REFERENCES "credit_attributes"("id") ON DELETE CASCADE,
  FOREIGN KEY("credit_type_id") REFERENCES "credit_types"("id") ON DELETE CASCADE
);

-- A performer credited on a scene, with a credit type and optional alias.
CREATE TABLE "scene_credits" (
  "id" SERIAL PRIMARY KEY,
  "scene_id" UUID NOT NULL,
  "performer_id" UUID NOT NULL,
  "credit_type_id" INTEGER NOT NULL,
  "as" TEXT,
  FOREIGN KEY("scene_id") REFERENCES "scenes"("id") ON DELETE CASCADE,
  FOREIGN KEY("performer_id") REFERENCES "performers"("id") ON DELETE CASCADE,
  FOREIGN KEY("credit_type_id") REFERENCES "credit_types"("id") ON DELETE RESTRICT
);

CREATE INDEX scene_credits_performer_idx ON scene_credits (performer_id);
CREATE INDEX scene_credits_type_idx ON scene_credits (credit_type_id);

-- Attributes attached to a specific scene credit.
CREATE TABLE "scene_credit_attributes" (
  "scene_credit_id" INTEGER NOT NULL,
  "credit_attribute_id" INTEGER NOT NULL,
  PRIMARY KEY("scene_credit_id", "credit_attribute_id"),
  FOREIGN KEY("scene_credit_id") REFERENCES "scene_credits"("id") ON DELETE CASCADE,
  FOREIGN KEY("credit_attribute_id") REFERENCES "credit_attributes"("id") ON DELETE CASCADE
);

-- Migrate existing scene_performers to scene_credits with the Performer type (id = 1).
INSERT INTO "scene_credits" (scene_id, performer_id, credit_type_id, "as")
SELECT sp.scene_id, sp.performer_id, 1, sp."as"
FROM scene_performers sp;

-- performer_popularity_all_time depends on scene_performers; drop it so the table
-- can be dropped, then recreate it from scene_credits at the end of this migration.
DROP MATERIALIZED VIEW performer_popularity_all_time;

DROP TABLE scene_performers;

-- Migrate directors (scenes.director string) to performers + Director credits (type id = 2).
-- Use parent studio name when available to group directors across networks.
CREATE TEMP TABLE director_performers AS
SELECT DISTINCT
  s.director AS director_name,
  COALESCE(parent_st.name, st.name, 'Unknown Studio') AS studio_name
FROM scenes s
LEFT JOIN studios st ON s.studio_id = st.id
LEFT JOIN studios parent_st ON st.parent_studio_id = parent_st.id
WHERE s.director IS NOT NULL
  AND s.director != ''
  AND s.deleted = FALSE;

INSERT INTO performers (id, name, disambiguation, created_at, updated_at, deleted)
SELECT
  gen_random_uuid(),
  dp.director_name,
  dp.studio_name || ', migrated director',
  NOW(),
  NOW(),
  FALSE
FROM director_performers dp;

INSERT INTO scene_credits (scene_id, performer_id, credit_type_id)
SELECT
  s.id,
  p.id,
  2  -- Director credit type
FROM scenes s
LEFT JOIN studios st ON s.studio_id = st.id
LEFT JOIN studios parent_st ON st.parent_studio_id = parent_st.id
JOIN director_performers dp ON s.director = dp.director_name
  AND COALESCE(parent_st.name, st.name, 'Unknown Studio') = dp.studio_name
JOIN performers p ON p.name = dp.director_name
  AND p.disambiguation = dp.studio_name || ', migrated director'
WHERE s.director IS NOT NULL
  AND s.director != ''
  AND s.deleted = FALSE;

ALTER TABLE scenes DROP COLUMN director;

-- Migrate scene edit JSON: added/removed_performers and director -> added/removed_credits keyed
-- on credit_type_id (1 = Performer, 2 = Director). Legacy edits carry no attributes.

-- new_data added_performers -> added_credits
UPDATE edits
SET data = jsonb_set(
  data,
  '{new_data,added_credits}',
  COALESCE(data->'new_data'->'added_credits', '[]'::jsonb) ||
  (
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'performer_id', elem->>'performer_id',
        'credit_type_id', 1,
        'as', elem->'as'
      )
    ), '[]'::jsonb)
    FROM jsonb_array_elements(COALESCE(data->'new_data'->'added_performers', '[]'::jsonb)) AS elem
  )
)
WHERE data->'new_data'->'added_performers' IS NOT NULL
  AND target_type = 'SCENE';

-- new_data removed_performers -> removed_credits
UPDATE edits
SET data = jsonb_set(
  data,
  '{new_data,removed_credits}',
  COALESCE(data->'new_data'->'removed_credits', '[]'::jsonb) ||
  (
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'performer_id', elem->>'performer_id',
        'credit_type_id', 1,
        'as', elem->'as'
      )
    ), '[]'::jsonb)
    FROM jsonb_array_elements(COALESCE(data->'new_data'->'removed_performers', '[]'::jsonb)) AS elem
  )
)
WHERE data->'new_data'->'removed_performers' IS NOT NULL
  AND target_type = 'SCENE';

-- new_data director -> Director credit
UPDATE edits e
SET data = jsonb_set(
  data,
  '{new_data,added_credits}',
  COALESCE(data->'new_data'->'added_credits', '[]'::jsonb) ||
  jsonb_build_array(
    jsonb_build_object(
      'performer_id', (
        SELECT p.id FROM performers p
        WHERE p.name = (data->'new_data'->>'director')
          AND p.disambiguation LIKE '%migrated director'
        LIMIT 1
      ),
      'credit_type_id', 2
    )
  )
)
WHERE data->'new_data'->>'director' IS NOT NULL
  AND data->'new_data'->>'director' != ''
  AND target_type = 'SCENE'
  AND EXISTS (
    SELECT 1 FROM performers p
    WHERE p.name = (data->'new_data'->>'director')
      AND p.disambiguation LIKE '%migrated director'
  );

-- Remove old performer/director fields from new_data
UPDATE edits
SET data = jsonb_set(
  data,
  '{new_data}',
  (data->'new_data') #- '{added_performers}' #- '{removed_performers}' #- '{director}'
)
WHERE target_type = 'SCENE'
  AND (
    data->'new_data'->'added_performers' IS NOT NULL
    OR data->'new_data'->'removed_performers' IS NOT NULL
    OR data->'new_data'->'director' IS NOT NULL
  );

-- old_data added_performers -> added_credits
UPDATE edits
SET data = jsonb_set(
  data,
  '{old_data,added_credits}',
  COALESCE(data->'old_data'->'added_credits', '[]'::jsonb) ||
  (
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'performer_id', elem->>'performer_id',
        'credit_type_id', 1,
        'as', elem->'as'
      )
    ), '[]'::jsonb)
    FROM jsonb_array_elements(COALESCE(data->'old_data'->'added_performers', '[]'::jsonb)) AS elem
  )
)
WHERE data->'old_data'->'added_performers' IS NOT NULL
  AND target_type = 'SCENE';

-- old_data removed_performers -> removed_credits
UPDATE edits
SET data = jsonb_set(
  data,
  '{old_data,removed_credits}',
  COALESCE(data->'old_data'->'removed_credits', '[]'::jsonb) ||
  (
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'performer_id', elem->>'performer_id',
        'credit_type_id', 1,
        'as', elem->'as'
      )
    ), '[]'::jsonb)
    FROM jsonb_array_elements(COALESCE(data->'old_data'->'removed_performers', '[]'::jsonb)) AS elem
  )
)
WHERE data->'old_data'->'removed_performers' IS NOT NULL
  AND target_type = 'SCENE';

-- old_data director -> Director credit
UPDATE edits e
SET data = jsonb_set(
  data,
  '{old_data,added_credits}',
  COALESCE(data->'old_data'->'added_credits', '[]'::jsonb) ||
  jsonb_build_array(
    jsonb_build_object(
      'performer_id', (
        SELECT p.id FROM performers p
        WHERE p.name = (data->'old_data'->>'director')
          AND p.disambiguation LIKE '%migrated director'
        LIMIT 1
      ),
      'credit_type_id', 2
    )
  )
)
WHERE data->'old_data'->>'director' IS NOT NULL
  AND data->'old_data'->>'director' != ''
  AND target_type = 'SCENE'
  AND EXISTS (
    SELECT 1 FROM performers p
    WHERE p.name = (data->'old_data'->>'director')
      AND p.disambiguation LIKE '%migrated director'
  );

-- Remove old performer/director fields from old_data
UPDATE edits
SET data = jsonb_set(
  data,
  '{old_data}',
  (data->'old_data') #- '{added_performers}' #- '{removed_performers}' #- '{director}'
)
WHERE target_type = 'SCENE'
  AND data->'old_data' IS NOT NULL
  AND (
    data->'old_data'->'added_performers' IS NOT NULL
    OR data->'old_data'->'removed_performers' IS NOT NULL
    OR data->'old_data'->'director' IS NOT NULL
  );

-- Repoint the scene_search maintenance from scene_performers to scene_credits.
-- (scene_search is maintained by upsert_scene_search + statement triggers; the
-- scene_performers triggers were dropped with the table.)

CREATE OR REPLACE FUNCTION upsert_scene_search(sid UUID) RETURNS VOID AS $$
BEGIN
    DELETE FROM scene_search WHERE scene_id = sid
        AND EXISTS (SELECT 1 FROM scenes WHERE id = sid AND deleted = true);

    INSERT INTO scene_search (scene_id, scene_title, scene_date, studio_name, network_name, studio_aliases, network_aliases, performer_names, scene_code)
    SELECT S.id, S.title, S.date::TEXT, T.name, TP.name,
           COALESCE(ARRAY_AGG(DISTINCT SA.alias) FILTER (WHERE SA.alias IS NOT NULL), '{}'),
           COALESCE(ARRAY_AGG(DISTINCT NA.alias) FILTER (WHERE NA.alias IS NOT NULL), '{}'),
           COALESCE(ARRAY_AGG(DISTINCT P.name) FILTER (WHERE P.name IS NOT NULL), '{}') ||
           COALESCE(ARRAY_AGG(DISTINCT PS."as") FILTER (WHERE PS."as" IS NOT NULL), '{}'),
           S.code
    FROM scenes S
    LEFT JOIN scene_credits PS ON PS.scene_id = S.id AND PS.credit_type_id = 1
    LEFT JOIN performers P ON PS.performer_id = P.id
    LEFT JOIN studios T ON T.id = S.studio_id
    LEFT JOIN studio_aliases SA ON SA.studio_id = T.id
    LEFT JOIN studios TP ON T.parent_studio_id = TP.id
    LEFT JOIN studio_aliases NA ON NA.studio_id = TP.id
    WHERE S.id = sid AND S.deleted = false
    GROUP BY S.id, T.name, TP.name
    ON CONFLICT (scene_id) DO UPDATE SET
        scene_title = EXCLUDED.scene_title, scene_date = EXCLUDED.scene_date,
        studio_name = EXCLUDED.studio_name, network_name = EXCLUDED.network_name,
        studio_aliases = EXCLUDED.studio_aliases, network_aliases = EXCLUDED.network_aliases,
        performer_names = EXCLUDED.performer_names, scene_code = EXCLUDED.scene_code;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trg_performer_changed_scenes() RETURNS TRIGGER AS $$
BEGIN
    PERFORM upsert_scene_search(scene_id)
    FROM scene_credits WHERE performer_id = NEW.id;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS trg_scene_performers_inserted() CASCADE;
DROP FUNCTION IF EXISTS trg_scene_performers_deleted() CASCADE;

CREATE OR REPLACE FUNCTION trg_scene_credits_inserted() RETURNS TRIGGER AS $$
BEGIN
    PERFORM upsert_scene_search(scene_id)
    FROM (SELECT DISTINCT scene_id FROM new_rows) affected;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_scene_search_on_sc_insert
AFTER INSERT ON scene_credits
REFERENCING NEW TABLE AS new_rows
FOR EACH STATEMENT EXECUTE FUNCTION trg_scene_credits_inserted();

CREATE OR REPLACE FUNCTION trg_scene_credits_deleted() RETURNS TRIGGER AS $$
BEGIN
    PERFORM upsert_scene_search(scene_id)
    FROM (SELECT DISTINCT scene_id FROM old_rows) affected;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_scene_search_on_sc_delete
AFTER DELETE ON scene_credits
REFERENCING OLD TABLE AS old_rows
FOR EACH STATEMENT EXECUTE FUNCTION trg_scene_credits_deleted();

-- Recreate performer_popularity_all_time from scene_credits. Filter to the Performer
-- type to preserve the original on-screen-performer semantics (scene_performers held
-- only on-screen performers). COUNT(DISTINCT user_id) is unaffected by duplicate credits.
CREATE MATERIALIZED VIEW performer_popularity_all_time AS
SELECT sc.performer_id, COUNT(DISTINCT sf.user_id)::INT AS user_count
FROM scene_fingerprints sf
JOIN scene_credits sc ON sc.scene_id = sf.scene_id AND sc.credit_type_id = 1
GROUP BY sc.performer_id;

CREATE UNIQUE INDEX performer_popularity_all_time_performer_id_idx
  ON performer_popularity_all_time (performer_id);
CREATE INDEX performer_popularity_all_time_count_idx
  ON performer_popularity_all_time (user_count DESC, performer_id DESC);
