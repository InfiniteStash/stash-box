-- Step 1: Create temporary table of unique directors
CREATE TEMP TABLE director_performers AS
SELECT DISTINCT
  s.director AS director_name,
  s.studio_id,
  st.name AS studio_name
FROM scenes s
LEFT JOIN studios st ON s.studio_id = st.id
WHERE s.director IS NOT NULL
  AND s.director != ''
  AND s.deleted = FALSE;

-- Step 2: Insert performers for each director
INSERT INTO performers (id, name, disambiguation, created_at, updated_at, deleted)
SELECT
  gen_random_uuid(),
  dp.director_name,
  COALESCE(dp.studio_name, 'Unknown Studio') || ', migrated director',
  NOW(),
  NOW(),
  FALSE
FROM director_performers dp;

-- Step 3: Create DIRECTOR credits
INSERT INTO scene_credits (scene_id, performer_id, credit_type_id)
SELECT
  s.id,
  p.id,
  2  -- DIRECTOR credit type
FROM scenes s
JOIN director_performers dp ON s.director = dp.director_name
  AND (
    (s.studio_id = dp.studio_id) OR
    (s.studio_id IS NULL AND dp.studio_id IS NULL)
  )
JOIN performers p ON p.name = dp.director_name
  AND p.disambiguation = COALESCE(dp.studio_name, 'Unknown Studio') || ', migrated director'
WHERE s.director IS NOT NULL
  AND s.director != ''
  AND s.deleted = FALSE;

-- Step 4: Drop director column
ALTER TABLE scenes DROP COLUMN director;
