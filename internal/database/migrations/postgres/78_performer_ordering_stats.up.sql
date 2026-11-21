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
SELECT p.id AS performer_id, COALESCE(popularity.user_count, 0) AS user_count,
       credits.debut, credits.last_scene, COALESCE(credits.scene_count, 0) AS scene_count
FROM performers p
LEFT JOIN credits ON credits.performer_id = p.id
LEFT JOIN popularity ON popularity.performer_id = p.id;

CREATE UNIQUE INDEX performer_ordering_stats_performer_id_idx
    ON performer_ordering_stats (performer_id);
CREATE INDEX performer_ordering_stats_user_count_idx
    ON performer_ordering_stats (user_count DESC, performer_id DESC);

DROP MATERIALIZED VIEW performer_popularity_all_time;
ALTER MATERIALIZED VIEW performer_ordering_stats RENAME TO performer_popularity_all_time;
