CREATE TABLE "items" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "rarity" INTEGER,
    "iconName" TEXT,
    "iconUrl" TEXT,
    "raw" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "items_name_idx" ON "items"("name");
CREATE INDEX "items_slug_idx" ON "items"("slug");
CREATE INDEX "items_type_idx" ON "items"("type");
CREATE INDEX "items_rarity_idx" ON "items"("rarity");
