CREATE MATERIALIZED VIEW scene_search AS 
SELECT S.id as scene_id, to_tsvector('english', S.title) || to_tsvector('simple', T.name)  || to_tsvector('simple', (STRING_AGG(P.name, ' ') || COALESCE(STRING_AGG(PS.as , ''), ''))) tsv FROM scenes S
LEFT JOIN scene_performers PS ON PS.scene_id = S.id
LEFT JOIN performers P ON PS.performer_id = P.id
LEFT JOIN studios T ON T.id = S.studio_id
GROUP BY S.id, S.title, T.name;

CREATE INDEX weighted_tsv_idx ON scene_search USING GIST (tsv);
CREATE INDEX name_trgm_idx ON performers USING GIN (name gin_trgm_ops);

CREATE OR REPLACE FUNCTION refresh_scene_search()
RETURNS TRIGGER LANGUAGE plpgsql
AS $$
BEGIN
REFRESH MATERIALIZED VIEW CONCURRENTLY scene_search;
RETURN NULL;
END $$;

CREATE TRIGGER refresh_scene_search
AFTER INSERT OR UPDATE OR DELETE OR TRUNCATE
ON scenes
FOR EACH STATEMENT
EXECUTE PROCEDURE refresh_scene_search();

CREATE TRIGGER refresh_scene_search
AFTER INSERT OR UPDATE OR DELETE OR TRUNCATE
ON scene_performers
FOR EACH STATEMENT
EXECUTE PROCEDURE refresh_scene_search();

CREATE TRIGGER refresh_scene_search
AFTER INSERT OR UPDATE OR DELETE OR TRUNCATE
ON performers
FOR EACH STATEMENT
EXECUTE PROCEDURE refresh_scene_search();

CREATE TRIGGER refresh_scene_search
AFTER INSERT OR UPDATE OR DELETE OR TRUNCATE
ON studios
FOR EACH STATEMENT
EXECUTE PROCEDURE refresh_scene_search();
