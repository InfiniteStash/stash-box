ALTER TABLE "scenes"
ADD COLUMN duration integer
ADD COLUMN director TEXT;

ALTER TABLE "scene_urls"
ADD COLUMN id uuid not null,
ADD COLUMN height int not null,
ADD COLUMN width int not null;

ALTER TABLE "performer_urls"
ADD COLUMN id uuid not null,
ADD COLUMN height int not null,
ADD COLUMN width int not null;
