ALTER TABLE "Budget"
ADD COLUMN "category" TEXT NOT NULL DEFAULT 'Other';

UPDATE "Budget"
SET "category" = "name"
WHERE "category" = 'Other';

CREATE INDEX "Budget_userId_category_idx"
ON "Budget"("userId", "category");
