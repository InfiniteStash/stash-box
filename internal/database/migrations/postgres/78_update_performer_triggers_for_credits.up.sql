-- Update the performer trigger function to use scene_credits instead of scene_performers
CREATE OR REPLACE FUNCTION update_performers() RETURNS TRIGGER AS $$
BEGIN
IF (NEW.name != OLD.name) THEN
UPDATE scene_search SET performer_names = SUBQUERY.performer_names
FROM (
SELECT S.id as scene_id, ARRAY_TO_STRING(ARRAY_CAT(ARRAY_AGG(P.name), ARRAY_AGG(SC.as)), ' ', '') AS performer_names
 FROM scene_credits SC
 JOIN scenes S ON SC.scene_id = S.id
 LEFT JOIN scene_credits PPS ON S.id = PPS.scene_id
 LEFT JOIN performers P ON PPS.performer_id = P.id
 WHERE SC.performer_id = NEW.id
 GROUP BY S.id
) SUBQUERY
WHERE scene_search.scene_id = SUBQUERY.scene_id;
END IF;
RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Update the scene_credits trigger function to use scene_credits instead of scene_performers
CREATE OR REPLACE FUNCTION update_scene_performers() RETURNS TRIGGER AS $$
BEGIN
UPDATE scene_search SET performer_names = SUBQUERY.performer_names
FROM (
SELECT SC.scene_id as scene_id, ARRAY_TO_STRING(ARRAY_CAT(ARRAY_AGG(P.name), ARRAY_AGG(SC.as)), ' ', '') AS performer_names
 FROM scene_credits SC
 LEFT JOIN performers P ON SC.performer_id = P.id
 WHERE SC.scene_id = NEW.scene_id
 GROUP BY SC.scene_id
) SUBQUERY
WHERE scene_search.scene_id = COALESCE(NEW.scene_id, OLD.scene_id);
RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop the old trigger on scene_performers table (which no longer exists)
DROP TRIGGER IF EXISTS update_scene_performers_search ON scene_performers;

-- Create the trigger on scene_credits table instead
DROP TRIGGER IF EXISTS update_scene_credits_search ON scene_credits;
CREATE TRIGGER update_scene_credits_search AFTER INSERT OR UPDATE OR DELETE ON scene_credits FOR EACH ROW EXECUTE PROCEDURE update_scene_performers();
