CREATE TABLE "credit_roles" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "description" TEXT,
  "created_at" TIMESTAMP NOT NULL,
  "updated_at" TIMESTAMP NOT NULL
);

INSERT INTO "credit_roles" (name, description, created_at, updated_at) VALUES
  ('PERFORMANCE', 'On-screen performance', NOW(), NOW()),
  ('DIRECTOR', 'Scene director', NOW(), NOW());

CREATE TABLE "credit_role_tags" (
  "credit_role_id" INTEGER NOT NULL,
  "tag_id" UUID NOT NULL,
  PRIMARY KEY("credit_role_id", "tag_id"),
  FOREIGN KEY("credit_role_id") REFERENCES "credit_roles"("id") ON DELETE CASCADE,
  FOREIGN KEY("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE
);
