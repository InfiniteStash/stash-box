-- Build the replacement before taking the lock needed to swap the views.
CREATE MATERIALIZED VIEW performer_ordering_stats AS
WITH credits AS (
    SELECT sp.performer_id, MIN(s.date)::TEXT AS debut, MAX(s.date)::TEXT AS last_scene,
           COUNT(*) AS scene_count
    FROM scene_performers sp
    JOIN scenes s ON s.id = sp.scene_id
    GROUP BY sp.performer_id
), popularity AS (
    SELECT sp.performer_id, COUNT(DISTINCT sf.user_id)::INT AS user_count
    FROM scene_fingerprints sf
    JOIN scene_performers sp ON sp.scene_id = sf.scene_id
    GROUP BY sp.performer_id
)
SELECT p.id AS performer_id, p.name AS performer_name, COALESCE(popularity.user_count, 0) AS user_count,
       credits.debut, credits.last_scene, COALESCE(credits.scene_count, 0) AS scene_count
FROM performers p
LEFT JOIN credits ON credits.performer_id = p.id
LEFT JOIN popularity ON popularity.performer_id = p.id;

CREATE UNIQUE INDEX performer_ordering_stats_performer_id_idx
    ON performer_ordering_stats (performer_id);
CREATE INDEX performer_ordering_stats_user_count_idx
    ON performer_ordering_stats (user_count DESC, performer_name DESC, performer_id DESC);
CREATE INDEX performer_ordering_stats_scene_count_idx
    ON performer_ordering_stats (scene_count DESC, performer_name DESC, performer_id DESC);
CREATE INDEX performer_ordering_stats_debut_desc_idx
    ON performer_ordering_stats (debut DESC NULLS LAST, performer_name DESC, performer_id DESC);
CREATE INDEX performer_ordering_stats_debut_asc_idx
    ON performer_ordering_stats (debut ASC NULLS LAST, performer_name ASC, performer_id ASC);
CREATE INDEX performer_ordering_stats_last_scene_desc_idx
    ON performer_ordering_stats (last_scene DESC NULLS LAST, performer_name DESC, performer_id DESC);
CREATE INDEX performer_ordering_stats_last_scene_asc_idx
    ON performer_ordering_stats (last_scene ASC NULLS LAST, performer_name ASC, performer_id ASC);
ANALYZE performer_ordering_stats;

DROP MATERIALIZED VIEW performer_popularity_all_time;
ALTER MATERIALIZED VIEW performer_ordering_stats RENAME TO performer_popularity_all_time;
