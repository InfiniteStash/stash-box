CREATE TABLE "scene_credits" (
  "id" SERIAL PRIMARY KEY,
  "scene_id" UUID NOT NULL,
  "performer_id" UUID NOT NULL,
  "credit_role_id" INTEGER NOT NULL,
  "as" TEXT,
  FOREIGN KEY("scene_id") REFERENCES "scenes"("id") ON DELETE CASCADE,
  FOREIGN KEY("performer_id") REFERENCES "performers"("id") ON DELETE CASCADE,
  FOREIGN KEY("credit_role_id") REFERENCES "credit_roles"("id") ON DELETE RESTRICT
);

CREATE INDEX scene_credits_performer_idx ON scene_credits (performer_id);
CREATE INDEX scene_credits_role_idx ON scene_credits (credit_role_id);

CREATE TABLE "scene_credit_tags" (
  "scene_credit_id" INTEGER NOT NULL,
  "tag_id" UUID NOT NULL,
  PRIMARY KEY("scene_credit_id", "tag_id"),
  FOREIGN KEY("scene_credit_id") REFERENCES "scene_credits"("id") ON DELETE CASCADE,
  FOREIGN KEY("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE
);
