CREATE TYPE credit AS ENUM ('PERFORMER', 'DIRECTOR', 'NONSEX');

ALTER TABLE scene_performers ADD COLUMN type credit;

/* Create director performer entities */
INSERT INTO performers (id, name, disambiguation, created_at, updated_at)
SELECT uuid_generate_v4(), dir, 'Director', now(), now() FROM (
select E.data->'old_data'->>'director' as dir from scene_edits SE JOIN edits E ON SE.edit_id = E.id UNION
select E.data->'new_data'->>'director' as dir from scene_edits SE JOIN edits E ON SE.edit_id = E.id UNION
select director as dir from scenes) A
WHERE dir IS NOT NULL
GROUP BY dir;

/* Migrate edits setting a director to setting a director performer credit */
UPDATE edits
SET data = jsonb_set(
	data,
	'{new_data,added_performers}',
	COALESCE(data->'new_data'->'added_performers', '[]'::JSONB) || jsonb_build_object('performer_id', A.performer_id, 'type', 'DIRECTOR'),
	true
) #- '{new_data,director}'
FROM (select P.id as performer_id, E.id as edit_id from scene_edits SE
JOIN edits E ON E.id = SE.edit_id
JOIN performers P ON P.disambiguation = 'Director' AND name = E.data->'new_data'->>'director'
WHERE E.data->'new_data'->>'director' IS NOT NULL) A
WHERE edits.id=A.edit_id;

/* Migrate edits removing a director to removing a director performer credit */
UPDATE edits
SET data = jsonb_set(
	data,
	'{new_data,removed_performers}',
	COALESCE(data->'new_data'->'removed_performers', '[]'::JSONB) || jsonb_build_object('performer_id', A.performer_id, 'type', 'DIRECTOR'),
	true
) #- '{old_data,director}'
FROM (select P.id as performer_id, E.id as edit_id
FROM scene_edits SE
JOIN edits E ON E.id = SE.edit_id
JOIN performers P ON P.disambiguation = 'Director' AND name = E.data->'old_data'->>'director'
WHERE E.data->'old_data'->>'director' != '') A
WHERE edits.id=A.edit_id;

/* Insert scene director credits */
INSERT INTO scene_performers (scene_id, performer_id, type)
SELECT S.id, P.id, 'DIRECTOR' from scenes S JOIN performers P ON P.name = S.director AND P.disambiguation = 'Director' WHERE S.director IS NOT NULL;

/* Delete old director column */
ALTER TABLE scenes DROP COLUMN `director`;
