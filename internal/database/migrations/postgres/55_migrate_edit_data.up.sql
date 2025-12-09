-- Step 1: Migrate new_data added_performers to added_credits
UPDATE edits
SET data = jsonb_set(
  data,
  '{new_data,added_credits}',
  COALESCE(data->'new_data'->'added_credits', '[]'::jsonb) ||
  (
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'performer_id', elem->>'performer_id',
        'credit_role_id', 1,
        'as', elem->'as'
      )
    ), '[]'::jsonb)
    FROM jsonb_array_elements(COALESCE(data->'new_data'->'added_performers', '[]'::jsonb)) AS elem
  )
)
WHERE data->'new_data'->'added_performers' IS NOT NULL
  AND target_type = 'SCENE';

-- Step 2: Migrate new_data removed_performers to removed_credits
UPDATE edits
SET data = jsonb_set(
  data,
  '{new_data,removed_credits}',
  COALESCE(data->'new_data'->'removed_credits', '[]'::jsonb) ||
  (
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'performer_id', elem->>'performer_id',
        'credit_role_id', 1,
        'as', elem->'as'
      )
    ), '[]'::jsonb)
    FROM jsonb_array_elements(COALESCE(data->'new_data'->'removed_performers', '[]'::jsonb)) AS elem
  )
)
WHERE data->'new_data'->'removed_performers' IS NOT NULL
  AND target_type = 'SCENE';

-- Step 3: Migrate new_data director field changes to director credits
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
      'credit_role_id', 2
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

-- Step 4: Remove old performer and director fields from new_data
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

-- Step 5: Migrate old_data added_performers to added_credits
UPDATE edits
SET data = jsonb_set(
  data,
  '{old_data,added_credits}',
  COALESCE(data->'old_data'->'added_credits', '[]'::jsonb) ||
  (
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'performer_id', elem->>'performer_id',
        'credit_role_id', 1,
        'as', elem->'as'
      )
    ), '[]'::jsonb)
    FROM jsonb_array_elements(COALESCE(data->'old_data'->'added_performers', '[]'::jsonb)) AS elem
  )
)
WHERE data->'old_data'->'added_performers' IS NOT NULL
  AND target_type = 'SCENE';

-- Step 6: Migrate old_data removed_performers to removed_credits
UPDATE edits
SET data = jsonb_set(
  data,
  '{old_data,removed_credits}',
  COALESCE(data->'old_data'->'removed_credits', '[]'::jsonb) ||
  (
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'performer_id', elem->>'performer_id',
        'credit_role_id', 1,
        'as', elem->'as'
      )
    ), '[]'::jsonb)
    FROM jsonb_array_elements(COALESCE(data->'old_data'->'removed_performers', '[]'::jsonb)) AS elem
  )
)
WHERE data->'old_data'->'removed_performers' IS NOT NULL
  AND target_type = 'SCENE';

-- Step 7: Migrate old_data director to director credits
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
      'credit_role_id', 2
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

-- Step 8: Remove old performer and director fields from old_data
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
