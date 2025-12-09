-- Step 1: Create temporary table of unique directors
-- Use parent studio name when available to group directors across networks
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

-- Step 2: Insert performers for each director
INSERT INTO performers (id, name, disambiguation, created_at, updated_at, deleted)
SELECT
  gen_random_uuid(),
  dp.director_name,
  dp.studio_name || ', migrated director',
  NOW(),
  NOW(),
  FALSE
FROM director_performers dp;

-- Step 3: Create DIRECTOR credits
INSERT INTO scene_credits (scene_id, performer_id, credit_role_id)
SELECT
  s.id,
  p.id,
  2  -- DIRECTOR credit role
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

-- Step 4: Drop director column
ALTER TABLE scenes DROP COLUMN director;
