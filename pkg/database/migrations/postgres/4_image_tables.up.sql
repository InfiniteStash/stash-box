CREATE TABLE images (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    url VARCHAR NOT NULL,
    width INT,
    height INT
);

CREATE TABLE scene_images (
    scene_id uuid REFERENCES scenes(id) NOT NULL,
    image_id uuid REFERENCES images(id) NOT NULL
);

CREATE TABLE performer_images (
    performer_id uuid REFERENCES performers(id) NOT NULL,
    image_id uuid REFERENCES images(id) NOT NULL
);

CREATE TABLE studio_images (
    studio_id uuid REFERENCES studios(id) NOT NULL,
    image_id uuid REFERENCES images(id) NOT NULL
);

INSERT INTO images (id, url, width, height)
SELECT id, url, width, height FROM performer_urls
WHERE type = 'PHOTO' AND is IS NOT NULL;

INSERT INTO performer_images (performer_id, image_id)
SELECT performer_id, id FROM performer_urls
WHERE type = 'PHOTO' AND is IS NOT NULL;

INSERT INTO images (id, url, width, height)
SELECT id, MIN(url), MIN(width), MIN(height) FROM scene_urls
WHERE type = 'PHOTO' AND id IS NOT NULL
GROUP BY id;

INSERT INTO scene_images (scene_id, image_id)
SELECT scene_id, id FROM scene_urls
WHERE type = 'PHOTO' AND id IS NOT NULL;

DELETE FROM performer_urls
WHERE type = 'PHOTO';

DELETE FROM scene_urls
WHERE type = 'PHOTO';

ALTER TABLE performer_urls
DROP COLUMN id,
DROP COLUMN width,
DROP COLUMN height;

ALTER TABLE scene_urls
DROP COLUMN id,
DROP COLUMN width,
DROP COLUMN height;
