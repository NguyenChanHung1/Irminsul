-- CreateTable
CREATE TABLE "data_sources" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crawl_runs" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "job" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "sourceUrls" JSONB NOT NULL,
    "sourceVersions" JSONB NOT NULL DEFAULT '{}',
    "entityLimit" INTEGER,
    "counts" JSONB NOT NULL,
    "validationIssues" JSONB NOT NULL DEFAULT '[]',
    "outputPath" TEXT,
    "fetchedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crawl_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "characters" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rarity" INTEGER,
    "elementId" TEXT,
    "weaponTypeId" TEXT,
    "nationId" TEXT,
    "affiliation" TEXT,
    "title" TEXT,
    "description" TEXT,
    "releaseDate" TIMESTAMP(3),
    "birthday" TEXT,
    "constellation" TEXT,
    "iconName" TEXT,
    "iconUrl" TEXT,
    "baseHp" DOUBLE PRECISION,
    "baseAtk" DOUBLE PRECISION,
    "baseDef" DOUBLE PRECISION,
    "critRate" DOUBLE PRECISION,
    "critDmg" DOUBLE PRECISION,
    "statsModifier" JSONB NOT NULL DEFAULT '{}',
    "ascensionMaterials" JSONB NOT NULL DEFAULT '{}',
    "talentMaterials" JSONB NOT NULL DEFAULT '{}',
    "talents" JSONB NOT NULL DEFAULT '[]',
    "passiveTalents" JSONB NOT NULL DEFAULT '[]',
    "constellations" JSONB NOT NULL DEFAULT '[]',
    "voiceCast" JSONB NOT NULL DEFAULT '{}',
    "stories" JSONB NOT NULL DEFAULT '[]',
    "quotes" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "characters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weapons" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rarity" INTEGER,
    "weaponTypeId" TEXT,
    "baseAttack" INTEGER,
    "subStat" TEXT,
    "passiveName" TEXT,
    "passiveDescription" TEXT,
    "description" TEXT,
    "location" TEXT,
    "ascensionMaterialGroup" TEXT,
    "ascensionMaterials" JSONB NOT NULL DEFAULT '{}',
    "statsModifier" JSONB NOT NULL DEFAULT '{}',
    "story" JSONB NOT NULL DEFAULT '[]',
    "iconName" TEXT,
    "iconUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weapons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artifact_sets" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ranks" JSONB NOT NULL DEFAULT '[]',
    "maxRarity" INTEGER,
    "twoPieceBonus" TEXT,
    "fourPieceBonus" TEXT,
    "setBonuses" JSONB NOT NULL DEFAULT '{}',
    "parts" JSONB NOT NULL DEFAULT '{}',
    "iconName" TEXT,
    "iconUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "artifact_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materials" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "groupId" TEXT,
    "family" TEXT,
    "rarity" INTEGER,
    "description" TEXT,
    "source" JSONB,
    "availability" JSONB,
    "iconName" TEXT,
    "iconUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "material_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enemies" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT,
    "enemyType" TEXT,
    "family" TEXT,
    "description" TEXT,
    "artifacts" JSONB NOT NULL DEFAULT '[]',
    "iconName" TEXT,
    "iconUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enemies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dungeons" (
    "id" TEXT NOT NULL,
    "slug" TEXT,
    "name" TEXT NOT NULL,
    "domainType" TEXT,
    "nationId" TEXT,
    "location" TEXT,
    "requirements" JSONB NOT NULL DEFAULT '[]',
    "recommendedElements" JSONB NOT NULL DEFAULT '[]',
    "rewards" JSONB NOT NULL DEFAULT '[]',
    "enemyWaves" JSONB NOT NULL DEFAULT '[]',
    "iconName" TEXT,
    "iconUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dungeons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "character_materials" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "source" TEXT,
    "quantity" INTEGER,
    "level" TEXT,

    CONSTRAINT "character_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weapon_materials" (
    "id" TEXT NOT NULL,
    "weaponId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "source" TEXT,
    "quantity" INTEGER,
    "level" TEXT,

    CONSTRAINT "weapon_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enemy_drops" (
    "enemyId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "rarity" INTEGER,
    "minimumLevel" INTEGER,

    CONSTRAINT "enemy_drops_pkey" PRIMARY KEY ("enemyId","materialId")
);

-- CreateTable
CREATE TABLE "dungeon_rewards" (
    "id" TEXT NOT NULL,
    "dungeonId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "day" TEXT,
    "level" INTEGER,
    "dropMin" INTEGER,
    "dropMax" INTEGER,
    "average" DOUBLE PRECISION,

    CONSTRAINT "dungeon_rewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "elements" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "elements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weapon_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "weapon_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "nations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "data_sources_key_key" ON "data_sources"("key");

-- CreateIndex
CREATE INDEX "crawl_runs_sourceId_idx" ON "crawl_runs"("sourceId");

-- CreateIndex
CREATE INDEX "crawl_runs_job_idx" ON "crawl_runs"("job");

-- CreateIndex
CREATE INDEX "crawl_runs_fetchedAt_idx" ON "crawl_runs"("fetchedAt");

-- CreateIndex
CREATE INDEX "characters_name_idx" ON "characters"("name");

-- CreateIndex
CREATE INDEX "characters_slug_idx" ON "characters"("slug");

-- CreateIndex
CREATE INDEX "characters_elementId_idx" ON "characters"("elementId");

-- CreateIndex
CREATE INDEX "characters_weaponTypeId_idx" ON "characters"("weaponTypeId");

-- CreateIndex
CREATE INDEX "characters_nationId_idx" ON "characters"("nationId");

-- CreateIndex
CREATE INDEX "weapons_name_idx" ON "weapons"("name");

-- CreateIndex
CREATE INDEX "weapons_slug_idx" ON "weapons"("slug");

-- CreateIndex
CREATE INDEX "weapons_weaponTypeId_idx" ON "weapons"("weaponTypeId");

-- CreateIndex
CREATE INDEX "weapons_rarity_idx" ON "weapons"("rarity");

-- CreateIndex
CREATE INDEX "weapons_ascensionMaterialGroup_idx" ON "weapons"("ascensionMaterialGroup");

-- CreateIndex
CREATE INDEX "artifact_sets_name_idx" ON "artifact_sets"("name");

-- CreateIndex
CREATE INDEX "artifact_sets_slug_idx" ON "artifact_sets"("slug");

-- CreateIndex
CREATE INDEX "artifact_sets_maxRarity_idx" ON "artifact_sets"("maxRarity");

-- CreateIndex
CREATE INDEX "materials_name_idx" ON "materials"("name");

-- CreateIndex
CREATE INDEX "materials_slug_idx" ON "materials"("slug");

-- CreateIndex
CREATE INDEX "materials_groupId_idx" ON "materials"("groupId");

-- CreateIndex
CREATE INDEX "materials_family_idx" ON "materials"("family");

-- CreateIndex
CREATE INDEX "materials_rarity_idx" ON "materials"("rarity");

-- CreateIndex
CREATE INDEX "enemies_name_idx" ON "enemies"("name");

-- CreateIndex
CREATE INDEX "enemies_slug_idx" ON "enemies"("slug");

-- CreateIndex
CREATE INDEX "enemies_region_idx" ON "enemies"("region");

-- CreateIndex
CREATE INDEX "enemies_enemyType_idx" ON "enemies"("enemyType");

-- CreateIndex
CREATE INDEX "enemies_family_idx" ON "enemies"("family");

-- CreateIndex
CREATE INDEX "dungeons_name_idx" ON "dungeons"("name");

-- CreateIndex
CREATE INDEX "dungeons_slug_idx" ON "dungeons"("slug");

-- CreateIndex
CREATE INDEX "dungeons_domainType_idx" ON "dungeons"("domainType");

-- CreateIndex
CREATE INDEX "dungeons_nationId_idx" ON "dungeons"("nationId");

-- CreateIndex
CREATE INDEX "character_materials_materialId_idx" ON "character_materials"("materialId");

-- CreateIndex
CREATE UNIQUE INDEX "character_materials_characterId_materialId_source_level_key" ON "character_materials"("characterId", "materialId", "source", "level");

-- CreateIndex
CREATE INDEX "weapon_materials_materialId_idx" ON "weapon_materials"("materialId");

-- CreateIndex
CREATE UNIQUE INDEX "weapon_materials_weaponId_materialId_source_level_key" ON "weapon_materials"("weaponId", "materialId", "source", "level");

-- CreateIndex
CREATE INDEX "enemy_drops_materialId_idx" ON "enemy_drops"("materialId");

-- CreateIndex
CREATE INDEX "dungeon_rewards_materialId_idx" ON "dungeon_rewards"("materialId");

-- CreateIndex
CREATE UNIQUE INDEX "dungeon_rewards_dungeonId_materialId_day_level_key" ON "dungeon_rewards"("dungeonId", "materialId", "day", "level");

-- CreateIndex
CREATE UNIQUE INDEX "elements_name_key" ON "elements"("name");

-- CreateIndex
CREATE UNIQUE INDEX "weapon_types_name_key" ON "weapon_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "nations_name_key" ON "nations"("name");

-- AddForeignKey
ALTER TABLE "crawl_runs" ADD CONSTRAINT "crawl_runs_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "data_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_elementId_fkey" FOREIGN KEY ("elementId") REFERENCES "elements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_nationId_fkey" FOREIGN KEY ("nationId") REFERENCES "nations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_weaponTypeId_fkey" FOREIGN KEY ("weaponTypeId") REFERENCES "weapon_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weapons" ADD CONSTRAINT "weapons_weaponTypeId_fkey" FOREIGN KEY ("weaponTypeId") REFERENCES "weapon_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "material_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dungeons" ADD CONSTRAINT "dungeons_nationId_fkey" FOREIGN KEY ("nationId") REFERENCES "nations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_materials" ADD CONSTRAINT "character_materials_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_materials" ADD CONSTRAINT "character_materials_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weapon_materials" ADD CONSTRAINT "weapon_materials_weaponId_fkey" FOREIGN KEY ("weaponId") REFERENCES "weapons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weapon_materials" ADD CONSTRAINT "weapon_materials_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enemy_drops" ADD CONSTRAINT "enemy_drops_enemyId_fkey" FOREIGN KEY ("enemyId") REFERENCES "enemies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enemy_drops" ADD CONSTRAINT "enemy_drops_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dungeon_rewards" ADD CONSTRAINT "dungeon_rewards_dungeonId_fkey" FOREIGN KEY ("dungeonId") REFERENCES "dungeons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dungeon_rewards" ADD CONSTRAINT "dungeon_rewards_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;
