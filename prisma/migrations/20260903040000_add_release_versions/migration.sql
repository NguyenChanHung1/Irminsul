ALTER TABLE "weapons"
ADD COLUMN "releaseVersion" TEXT,
ADD COLUMN "releaseOrder" INTEGER;

ALTER TABLE "artifact_sets"
ADD COLUMN "releaseVersion" TEXT,
ADD COLUMN "releaseOrder" INTEGER;

CREATE INDEX "weapons_releaseOrder_idx" ON "weapons"("releaseOrder");
CREATE INDEX "artifact_sets_releaseOrder_idx" ON "artifact_sets"("releaseOrder");
