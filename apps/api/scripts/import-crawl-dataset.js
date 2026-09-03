const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const genshinDb = require("genshin-db");
const { loadRootEnv } = require("./load-root-env");

loadRootEnv();

const prisma = new PrismaClient();
let materialCatalog = new Map();

function loadReleaseCatalog(resourceQuery) {
  const records = resourceQuery("names", {
    matchCategories: true,
    verboseCategories: true,
    queryLanguages: ["English"],
    resultLanguage: "English",
  });
  const byId = new Map();
  const byName = new Map();

  for (const record of Array.isArray(records) ? records : []) {
    if (record.id !== undefined && record.id !== null) {
      byId.set(String(record.id), record);
    }
    if (record.name) {
      byName.set(slugify(record.name), record);
    }
  }

  return { byId, byName };
}

const weaponReleaseCatalog = loadReleaseCatalog(genshinDb.weapons);
const artifactReleaseCatalog = loadReleaseCatalog(genshinDb.artifacts);

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function dateOrNull(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function jsonValue(value, fallback) {
  return value === undefined || value === null ? fallback : value;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function cleanId(value) {
  return String(value || "").trim();
}

function releaseMetadata(catalog, item) {
  const record = catalog.byId.get(cleanId(item.id)) || catalog.byName.get(slugify(item.name));
  const version = typeof record?.version === "string" ? record.version.trim() : "";
  const match = /^(\d+)\.(\d+)$/.exec(version);

  if (!match) {
    return { releaseVersion: null, releaseOrder: null };
  }

  return {
    releaseVersion: version,
    releaseOrder: Number(match[1]) * 1000 + Number(match[2]),
  };
}

function lookupId(value) {
  const id = slugify(value);
  return id || null;
}

const WEAPON_TYPES = {
  WEAPON_SWORD_ONE_HAND: "Sword",
  WEAPON_CLAYMORE: "Claymore",
  WEAPON_POLE: "Polearm",
  WEAPON_POLEARM: "Polearm",
  WEAPON_CATALYST: "Catalyst",
  WEAPON_BOW: "Bow",
};

const ELEMENT_ICON_URLS = {};

const IMPORT_ENTITY_ORDER = [
  "ascension_materials",
  "characters",
  "weapons",
  "artifacts",
  "enemies",
  "dungeons",
];

const IMPORT_ENTITY_ALIASES = {
  material: "ascension_materials",
  materials: "ascension_materials",
  item: "ascension_materials",
  items: "ascension_materials",
  character: "characters",
  weapon: "weapons",
  artifact: "artifacts",
  enemy: "enemies",
  dungeon: "dungeons",
  domain: "dungeons",
  domains: "dungeons",
};

function normalizeWeaponTypeName(name) {
  return WEAPON_TYPES[name] || name;
}

function elementIconUrl(element, explicitUrl) {
  if (explicitUrl && !String(explicitUrl).includes("genshin.jmp.blue")) {
    return explicitUrl;
  }
  ELEMENT_ICON_URLS[element] = explicitUrl;

  return ELEMENT_ICON_URLS[element] || "";
}

function normalizeIconUrl(iconName, iconUrl) {
  let resultName = "";
  let resultUrl = "";

  if (!iconName || !iconUrl) {
    return { iconName, iconUrl };
  }

  if (iconName.includes("_{0}")) resultName = iconName.replace("{0}", "Fire");
  if (iconUrl.includes("_{0}")) resultUrl = iconUrl.replace("{0}", "Fire");

  return {
    iconName: resultName == "" ? iconName : resultName,
    iconUrl: resultUrl == "" ? iconUrl : resultUrl,
  };
}

async function upsertElement(name, iconUrl) {
  const id = lookupId(name);
  if (!id) return null;
  const existing = await prisma.element.findUnique({ where: { name } });

  if (existing) {
    const updated = await prisma.element.update({
      where: { id: existing.id },
      data: {
        iconUrl: iconUrl || sanitizeRemovedSourceUrl(existing.iconUrl) || "",
      },
    });
    return updated.id;
  }

  const created = await prisma.element.create({
    data: {
      id,
      name,
      iconUrl: iconUrl || "",
    },
  });
  return created.id;
}

function sanitizeRemovedSourceUrl(url) {
  return url && !String(url).includes("genshin.jmp.blue") ? url : "";
}

async function upsertWeaponType(name, iconUrl) {
  const normalizeName = normalizeWeaponTypeName(name);
  const id = lookupId(normalizeName);
  if (!id) return null;
  const existing = await prisma.weaponType.findUnique({
    where: { name: normalizeName },
  });

  if (existing) {
    const updated = await prisma.weaponType.update({
      where: { id: existing.id },
      data: {
        iconUrl: iconUrl || existing.iconUrl || "",
      },
    });
    return updated.id;
  }

  const created = await prisma.weaponType.create({
    data: {
      id,
      name: normalizeName,
      iconUrl: iconUrl || "",
    },
  });
  return created.id;
}

async function upsertNation(name) {
  const id = lookupId(name);
  if (!id) return null;
  await prisma.nation.upsert({
    where: { id },
    update: { name },
    create: { id, name },
  });
  return id;
}

async function upsertMaterialGroup(name) {
  const id = lookupId(name);
  if (!id) return null;
  await prisma.materialGroup.upsert({
    where: { id },
    update: { name },
    create: { id, name },
  });
  return id;
}

async function ensureMaterial(materialLike) {
  const inputId = cleanId(materialLike.id || slugify(materialLike.name));
  const catalogMaterial = materialCatalog.get(inputId);
  const materialId = cleanId(inputId || catalogMaterial?.id || slugify(catalogMaterial?.name));
  if (!materialId) return null;

  const existing = await prisma.material.findUnique({ where: { id: materialId } });
  const incomingName = materialLike.name;
  const catalogName = catalogMaterial?.name;
  const existingName = existing?.name;
  const name = displayMaterialName(incomingName, catalogName, existingName, materialId);
  const groupId = await upsertMaterialGroup(
    materialLike.group || materialLike.family || catalogMaterial?.group || catalogMaterial?.family || existing?.family,
  );
  const iconName =
    materialLike.iconName || materialLike.icon_name || catalogMaterial?.iconName || catalogMaterial?.icon_name || existing?.iconName || null;
  const iconUrl = materialLike.icon_url || materialLike.iconUrl || catalogMaterial?.icon_url || catalogMaterial?.iconUrl || existing?.iconUrl || null;
  const source = materialLike.source ?? catalogMaterial?.source ?? existing?.source ?? [];
  const availability = materialLike.availability ?? catalogMaterial?.availability ?? existing?.availability ?? [];

  await prisma.material.upsert({
    where: { id: materialId },
    update: {
      slug: materialLike.slug || slugify(name),
      name,
      groupId,
      family: materialLike.family || catalogMaterial?.family || existing?.family || null,
      rarity: materialLike.rarity ?? catalogMaterial?.rarity ?? existing?.rarity ?? null,
      description: materialLike.description || catalogMaterial?.description || existing?.description || null,
      source: jsonValue(source, []),
      availability: jsonValue(availability, []),
      iconName,
      iconUrl,
    },
    create: {
      id: materialId,
      slug: materialLike.slug || slugify(name),
      name,
      groupId,
      family: materialLike.family || catalogMaterial?.family || null,
      rarity: materialLike.rarity ?? catalogMaterial?.rarity ?? null,
      description: materialLike.description || catalogMaterial?.description || null,
      source: jsonValue(source, []),
      availability: jsonValue(availability, []),
      iconName,
      iconUrl,
    },
  });
  return materialId;
}

async function upsertItem(itemLike) {
  const itemId = cleanId(itemLike.id || slugify(itemLike.name));
  if (!itemId) return null;

  const name = displayMaterialName(itemLike.name, null, null, itemId);
  const iconName = itemLike.iconName || itemLike.icon_name || itemLike.icon || null;
  const iconUrl = itemLike.icon_url || itemLike.iconUrl || null;
  const type = itemLike.type || itemLike.group || itemLike.material_type || itemLike.family || null;
  const rarity = itemLike.rarity ?? itemLike.rank ?? null;

  await prisma.item.upsert({
    where: { id: itemId },
    update: {
      slug: itemLike.slug || slugify(name),
      name,
      type,
      rarity,
      iconName,
      iconUrl,
      raw: jsonValue(itemLike.raw || itemLike, {}),
    },
    create: {
      id: itemId,
      slug: itemLike.slug || slugify(name),
      name,
      type,
      rarity,
      iconName,
      iconUrl,
      raw: jsonValue(itemLike.raw || itemLike, {}),
    },
  });

  return itemId;
}

function isNumericName(value) {
  return /^[0-9]+$/.test(String(value || "").trim());
}

function displayMaterialName(incomingName, catalogName, existingName, fallbackId) {
  for (const name of [incomingName, catalogName, existingName]) {
    if (name && !isNumericName(name)) {
      return name;
    }
  }
  return catalogName || existingName || incomingName || fallbackId;
}

async function importMetadata(metadata, outputPath) {
  const source = await prisma.dataSource.upsert({
    where: { key: "ns-primary-genshin-dev-supplemental" },
    update: {
      name: "NS primary + genshin.dev supplemental",
      baseUrl: metadata.source_base_urls?.ns_static || metadata.source_base_urls?.ns_site || "NS",
      description: metadata.source || null,
    },
    create: {
      key: "ns-primary-genshin-dev-supplemental",
      name: "NS primary + genshin.dev supplemental",
      baseUrl: metadata.source_base_urls?.ns_static || metadata.source_base_urls?.ns_site || "NS",
      description: metadata.source || null,
    },
  });

  await prisma.crawlRun.create({
    data: {
      sourceId: source.id,
      job: metadata.job || "crawl_job_game_data_import",
      language: metadata.language || "en",
      sourceUrls: jsonValue(metadata.source_urls, {}),
      sourceVersions: jsonValue(metadata.source_versions, {}),
      entityLimit: metadata.entity_limit ?? null,
      counts: jsonValue(metadata.counts, {}),
      validationIssues: jsonValue(metadata.validation_issues, []),
      outputPath,
      fetchedAt: dateOrNull(metadata.fetched_at) || new Date(),
    },
  });
}

async function importMaterials(materials) {
  for (const material of materials) {
    await upsertItem(material);
    await ensureMaterial(material);
  }
}

async function importCharacters(characters) {
  for (const character of characters) {
    const elementId = await upsertElement(
      character.element,
      elementIconUrl(character.element, character.element_icon_url || character.elementIconUrl),
    );
    
    const weaponTypeId = await upsertWeaponType(
      character.weapon_type,
      character.weapon_type_icon_url || character.weapon_type_url || character.weaponTypeIconUrl || null,
    );
    const nationId = await upsertNation(character.nation);

    await prisma.character.upsert({
      where: { id: cleanId(character.id) },
      update: {
        slug: character.slug || slugify(character.name),
        name: character.name,
        rarity: character.rarity ?? null,
        elementId,
        weaponTypeId,
        nationId,
        affiliation: character.affiliation || null,
        title: character.title || null,
        description: character.description || null,
        releaseDate: dateOrNull(character.release_date),
        birthday: character.birthday || null,
        constellation: character.constellation || null,
        iconName: character.iconName || null,
        iconUrl: character.icon_url || character.iconUrl || null,
        baseHp: character.base_hp ?? null,
        baseAtk: character.base_atk ?? null,
        baseDef: character.base_def ?? null,
        critRate: character.crit_rate ?? null,
        critDmg: character.crit_dmg ?? null,
        statsModifier: jsonValue(character.stats_modifier, {}),
        ascensionMaterials: jsonValue(character.ascension_materials, {}),
        talentMaterials: jsonValue(character.talent_materials, {}),
        talents: jsonValue(character.talents, []),
        passiveTalents: jsonValue(character.passive_talents, []),
        constellations: jsonValue(character.constellations, []),
        voiceCast: jsonValue(character.voice_cast, {}),
        stories: jsonValue(character.stories, []),
        quotes: jsonValue(character.quotes, []),
      },
      create: {
        id: cleanId(character.id),
        slug: character.slug || slugify(character.name),
        name: character.name,
        rarity: character.rarity ?? null,
        elementId,
        weaponTypeId,
        nationId,
        affiliation: character.affiliation || null,
        title: character.title || null,
        description: character.description || null,
        releaseDate: dateOrNull(character.release_date),
        birthday: character.birthday || null,
        constellation: character.constellation || null,
        iconName: character.iconName || null,
        iconUrl: character.icon_url || character.iconUrl || null,
        baseHp: character.base_hp ?? null,
        baseAtk: character.base_atk ?? null,
        baseDef: character.base_def ?? null,
        critRate: character.crit_rate ?? null,
        critDmg: character.crit_dmg ?? null,
        statsModifier: jsonValue(character.stats_modifier, {}),
        ascensionMaterials: jsonValue(character.ascension_materials, {}),
        talentMaterials: jsonValue(character.talent_materials, {}),
        talents: jsonValue(character.talents, []),
        passiveTalents: jsonValue(character.passive_talents, []),
        constellations: jsonValue(character.constellations, []),
        voiceCast: jsonValue(character.voice_cast, {}),
        stories: jsonValue(character.stories, []),
        quotes: jsonValue(character.quotes, []),
      },
    });

    await syncCharacterMaterials(cleanId(character.id), character);
  }
}

async function importWeapons(weapons) {
  for (const weapon of weapons) {
    const weaponTypeId = await upsertWeaponType(
      weapon.weapon_type,
      weapon.weapon_type_icon_url || weapon.weapon_type_url || weapon.weaponTypeIconUrl || null,
    );
    const { iconName, iconUrl } = normalizeIconUrl(weapon.iconName, weapon.icon_url);
    const { releaseVersion, releaseOrder } = releaseMetadata(weaponReleaseCatalog, weapon);

    await prisma.weapon.upsert({
      where: { id: cleanId(weapon.id) },
      update: {
        slug: weapon.slug || slugify(weapon.name),
        name: weapon.name,
        rarity: weapon.rarity ?? null,
        weaponTypeId,
        baseAttack: weapon.base_attack ?? null,
        subStat: weapon.sub_stat || null,
        passiveName: weapon.passive_name || null,
        passiveDescription: weapon.passive_description || null,
        description: weapon.description || null,
        location: weapon.location || null,
        releaseVersion,
        releaseOrder,
        ascensionMaterialGroup: weapon.ascension_material_group || null,
        ascensionMaterials: jsonValue(weapon.ascension_materials, {}),
        statsModifier: jsonValue(weapon.stats_modifier, {}),
        story: jsonValue(weapon.story, []),
        iconName: iconName,
        iconUrl: iconUrl,
      },
      create: {
        id: cleanId(weapon.id),
        slug: weapon.slug || slugify(weapon.name),
        name: weapon.name,
        rarity: weapon.rarity ?? null,
        weaponTypeId,
        baseAttack: weapon.base_attack ?? null,
        subStat: weapon.sub_stat || null,
        passiveName: weapon.passive_name || null,
        passiveDescription: weapon.passive_description || null,
        description: weapon.description || null,
        location: weapon.location || null,
        releaseVersion,
        releaseOrder,
        ascensionMaterialGroup: weapon.ascension_material_group || null,
        ascensionMaterials: jsonValue(weapon.ascension_materials, {}),
        statsModifier: jsonValue(weapon.stats_modifier, {}),
        story: jsonValue(weapon.story, []),
        iconName: iconName,
        iconUrl: iconUrl,
      },
    });

    await syncWeaponMaterials(cleanId(weapon.id), weapon);
  }
}

async function importArtifacts(artifacts) {
  for (const artifact of artifacts) {
    const { releaseVersion, releaseOrder } = releaseMetadata(artifactReleaseCatalog, artifact);
    await prisma.artifactSet.upsert({
      where: { id: cleanId(artifact.id) },
      update: {
        slug: artifact.slug || slugify(artifact.name),
        name: artifact.name,
        ranks: jsonValue(artifact.ranks, []),
        maxRarity: artifact.max_rarity ?? null,
        twoPieceBonus: artifact.two_piece_bonus || null,
        fourPieceBonus: artifact.four_piece_bonus || null,
        releaseVersion,
        releaseOrder,
        setBonuses: jsonValue(artifact.set_bonuses, {}),
        parts: jsonValue(artifact.parts, {}),
        iconName: artifact.iconName || null,
        iconUrl: artifact.icon_url || artifact.iconUrl || null,
      },
      create: {
        id: cleanId(artifact.id),
        slug: artifact.slug || slugify(artifact.name),
        name: artifact.name,
        ranks: jsonValue(artifact.ranks, []),
        maxRarity: artifact.max_rarity ?? null,
        twoPieceBonus: artifact.two_piece_bonus || null,
        fourPieceBonus: artifact.four_piece_bonus || null,
        releaseVersion,
        releaseOrder,
        setBonuses: jsonValue(artifact.set_bonuses, {}),
        parts: jsonValue(artifact.parts, {}),
        iconName: artifact.iconName || null,
        iconUrl: artifact.icon_url || artifact.iconUrl || null,
      },
    });
  }
}

async function importEnemies(enemies) {
  for (const enemy of enemies) {
    await prisma.enemy.upsert({
      where: { id: cleanId(enemy.id) },
      update: {
        slug: enemy.slug || slugify(enemy.name),
        name: enemy.name,
        region: enemy.region || null,
        enemyType: enemy.type || enemy.enemyType || null,
        family: enemy.family || null,
        description: enemy.description || null,
        artifacts: jsonValue(enemy.artifacts, []),
        iconName: enemy.iconName || null,
        iconUrl: enemy.icon_url || enemy.iconUrl || null,
      },
      create: {
        id: cleanId(enemy.id),
        slug: enemy.slug || slugify(enemy.name),
        name: enemy.name,
        region: enemy.region || null,
        enemyType: enemy.type || enemy.enemyType || null,
        family: enemy.family || null,
        description: enemy.description || null,
        artifacts: jsonValue(enemy.artifacts, []),
        iconName: enemy.iconName || null,
        iconUrl: enemy.icon_url || enemy.iconUrl || null,
      },
    });

    await syncEnemyDrops(cleanId(enemy.id), enemy);
  }
}

async function importDungeons(dungeons) {
  for (const dungeon of dungeons) {
    const nationId = await upsertNation(dungeon.nation);

    await prisma.dungeon.upsert({
      where: { id: cleanId(dungeon.id) },
      update: {
        slug: dungeon.slug || slugify(dungeon.name),
        name: dungeon.name,
        domainType: dungeon.domain_type || dungeon.domainType || null,
        nationId,
        location: dungeon.location || null,
        requirements: jsonValue(dungeon.requirements, []),
        recommendedElements: jsonValue(dungeon.recommended_elements, []),
        rewards: jsonValue(dungeon.rewards, []),
        enemyWaves: jsonValue(dungeon.enemy_waves, []),
        iconName: dungeon.iconName || null,
        iconUrl: dungeon.icon_url || dungeon.iconUrl || null,
      },
      create: {
        id: cleanId(dungeon.id),
        slug: dungeon.slug || slugify(dungeon.name),
        name: dungeon.name,
        domainType: dungeon.domain_type || dungeon.domainType || null,
        nationId,
        location: dungeon.location || null,
        requirements: jsonValue(dungeon.requirements, []),
        recommendedElements: jsonValue(dungeon.recommended_elements, []),
        rewards: jsonValue(dungeon.rewards, []),
        enemyWaves: jsonValue(dungeon.enemy_waves, []),
        iconName: dungeon.iconName || null,
        iconUrl: dungeon.icon_url || dungeon.iconUrl || null,
      },
    });

    await syncDungeonRewards(cleanId(dungeon.id), dungeon);
  }
}

async function syncCharacterMaterials(characterId, character) {
  await prisma.characterMaterial.deleteMany({ where: { characterId } });

  const rows = [
    ...flattenMaterialCosts(character.ascension_materials, "ascension"),
    ...flattenMaterialCosts(character.talent_materials, "talent"),
  ];

  for (const row of rows) {
    const materialId = await ensureMaterial(row.material);
    if (!materialId) continue;
    await prisma.characterMaterial.create({
      data: {
        characterId,
        materialId,
        source: row.source,
        level: row.level,
        quantity: row.quantity,
      },
    });
  }
}

async function syncWeaponMaterials(weaponId, weapon) {
  await prisma.weaponMaterial.deleteMany({ where: { weaponId } });

  for (const row of flattenMaterialCosts(weapon.ascension_materials, "ascension")) {
    const materialId = await ensureMaterial(row.material);
    if (!materialId) continue;
    await prisma.weaponMaterial.create({
      data: {
        weaponId,
        materialId,
        source: row.source,
        level: row.level,
        quantity: row.quantity,
      },
    });
  }
}

async function syncEnemyDrops(enemyId, enemy) {
  await prisma.enemyDrop.deleteMany({ where: { enemyId } });

  const seen = new Set();
  for (const drop of asArray(enemy.drops)) {
    const materialId = await ensureMaterial({
      id: drop.id || slugify(drop.name),
      name: drop.name,
      rarity: drop.rarity,
      group: "Enemy Drops",
    });
    if (!materialId) continue;
    const key = enemyId + ":" + materialId;
    if (seen.has(key)) continue;
    seen.add(key);
    await prisma.enemyDrop.create({
      data: {
        enemyId,
        materialId,
        rarity: drop.rarity ?? null,
        minimumLevel: drop["minimum-level"] ?? drop.minimumLevel ?? null,
      },
    });
  }
}

async function syncDungeonRewards(dungeonId, dungeon) {
  await prisma.dungeonReward.deleteMany({ where: { dungeonId } });

  const seen = new Set();
  for (const reward of asArray(dungeon.rewards)) {
    const day = reward.day || null;
    for (const detail of asArray(reward.details)) {
      const drops = [...asArray(detail.drops), ...asArray(detail.items)];
      for (const drop of drops) {
        const materialId = await ensureMaterial({
          id: drop.id || slugify(drop.name),
          name: drop.name,
          rarity: Number(drop.rarity) || null,
          group: "Dungeon Rewards",
        });
        if (!materialId) continue;
        const level = detail.level ?? null;
        const key = dungeonId + ":" + materialId + ":" + (day || "") + ":" + (level || "");
        if (seen.has(key)) continue;
        seen.add(key);
        await prisma.dungeonReward.create({
          data: {
            dungeonId,
            materialId,
            day,
            level,
            dropMin: drop.drop_min ?? null,
            dropMax: drop.drop_max ?? null,
            average: drop.avg ?? null,
          },
        });
      }
    }
  }
}

function flattenMaterialCosts(value, source) {
  const rows = [];

  function visit(node, level) {
    if (!node) return;
    if (Array.isArray(node)) {
      for (const item of node) visit(item, level);
      return;
    }
    if (typeof node !== "object") return;

    if (Array.isArray(node.mats)) {
      for (const mat of node.mats) {
        rows.push({
          source,
          level,
          quantity: mat.count ?? mat.value ?? null,
          material: {
            id: mat.id || slugify(mat.name),
            name: mat.name,
            rarity: mat.rank ?? mat.rarity ?? null,
            group: source === "talent" ? "Talent Materials" : "Ascension Materials",
          },
        });
      }

      if (node.cost !== undefined && node.cost !== null) {
        rows.push({
          source,
          level,
          quantity: node.cost,
          material: {
            id: "202",
            name: "Mora",
            rarity: 3,
            group: "Common Currency",
          },
        });
      }
    }

    for (const [key, child] of Object.entries(node)) {
      if (key === "mats") continue;
      const childLevel = level || key;
      if (Array.isArray(child)) {
        for (const mat of child) {
          if (mat && typeof mat === "object" && (mat.name || mat.id)) {
            rows.push({
              source,
              level: childLevel,
              quantity: mat.count ?? mat.value ?? null,
              material: {
                id: mat.id || slugify(mat.name),
                name: mat.name,
                rarity: mat.rank ?? mat.rarity ?? null,
                group: source === "talent" ? "Talent Materials" : "Ascension Materials",
              },
            });
          }
        }
      } else if (child && typeof child === "object") {
        visit(child, childLevel);
      }
    }
  }

  visit(value, null);
  return rows;
}

async function main() {
  const { datasetPath, entities } = parseImportArgs(process.argv.slice(2));
  const selectedEntities = new Set(entities || parseEntityList(process.env.CRAWL_IMPORT_ENTITIES));

  if (!selectedEntities.size) {
    for (const entity of IMPORT_ENTITY_ORDER) {
      selectedEntities.add(entity);
    }
  }

  if (!datasetPath) {
    throw new Error("Pass a dataset path as argv[2] or set CRAWL_DATASET_PATH.");
  }

  const { dataset, sourcePath } = loadDataset(datasetPath);
  console.log(`Importing crawl dataset: ${sourcePath}`);
  console.log(`Selected entities: ${[...selectedEntities].join(", ")}`);
  const data = dataset.data || {};
  materialCatalog = new Map(
    asArray(data.ascension_materials)
      .filter((material) => material?.id)
      .map((material) => [cleanId(material.id), material]),
  );

  await importMetadata(dataset.metadata || {}, sourcePath);

  if (selectedEntities.has("ascension_materials")) {
    await importMaterials(asArray(data.ascension_materials));
  }
  if (selectedEntities.has("characters")) {
    await importCharacters(asArray(data.characters));
  }
  if (selectedEntities.has("weapons")) {
    await importWeapons(asArray(data.weapons));
  }
  if (selectedEntities.has("artifacts")) {
    await importArtifacts(asArray(data.artifacts));
  }
  if (selectedEntities.has("enemies")) {
    await importEnemies(asArray(data.enemies));
  }
  if (selectedEntities.has("dungeons")) {
    await importDungeons(asArray(data.dungeons));
  }

  console.log(
    JSON.stringify(
      {
        imported: importCounts(data, selectedEntities),
        selected_entities: [...selectedEntities],
        dataset: sourcePath,
      },
      null,
      2,
    ),
  );
}

function parseImportArgs(argv) {
  let datasetPath = process.env.CRAWL_DATASET_PATH;
  let entities = null;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--entities" || arg === "--entity") {
      entities = parseEntityList(argv[index + 1]);
      index += 1;
      continue;
    }

    if (arg.startsWith("--entities=") || arg.startsWith("--entity=")) {
      entities = parseEntityList(arg.split("=").slice(1).join("="));
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      printImportHelp();
      process.exit(0);
    }

    if (!arg.startsWith("-") && !datasetPath) {
      datasetPath = arg;
      continue;
    }

    if (!arg.startsWith("-") && datasetPath === process.env.CRAWL_DATASET_PATH) {
      datasetPath = arg;
      continue;
    }

    throw new Error(`Unknown import argument: ${arg}`);
  }

  return { datasetPath, entities };
}

function parseEntityList(value) {
  if (!value) return null;

  const selected = new Set();
  for (const rawName of String(value).split(",")) {
    const name = rawName.trim().toLowerCase();
    if (!name) continue;

    const entity = IMPORT_ENTITY_ALIASES[name] || name;
    if (!IMPORT_ENTITY_ORDER.includes(entity)) {
      throw new Error(
        `Unknown entity "${rawName}". Use one of: ${IMPORT_ENTITY_ORDER.join(", ")}.`,
      );
    }
    selected.add(entity);
  }

  return [...selected];
}

function importCounts(data, selectedEntities) {
  return Object.fromEntries(
    IMPORT_ENTITY_ORDER
      .filter((entity) => selectedEntities.has(entity))
      .map((entity) => [entity, asArray(data[entity]).length]),
  );
}

function printImportHelp() {
  console.log(`Usage: node apps/api/scripts/import-crawl-dataset.js [datasetPath] [--entities characters,weapons]

Entities:
  ${IMPORT_ENTITY_ORDER.join(", ")}

Aliases:
  materials/items -> ascension_materials
  domains/domain  -> dungeons

Examples:
  npm run crawl:import -- /data/gi-data --entities characters
  CRAWL_IMPORT_ENTITIES=characters,weapons npm run crawl:import -- /data/gi-data`);
}

function loadDataset(inputPath) {
  const absolutePath = path.resolve(process.cwd(), inputPath);
  if (!fs.existsSync(absolutePath)) {
    fs.mkdirSync(absolutePath, { recursive: true });
    throw new Error(
      `Dataset directory was created but has no data yet: ${absolutePath}. Run CRAWLER_OUTPUT_DIR=${absolutePath} npm run crawl:job first.`,
    );
  }

  const stat = fs.statSync(absolutePath);
  if (stat.isFile()) {
    return {
      dataset: readJsonFile(absolutePath),
      sourcePath: absolutePath,
    };
  }

  if (!stat.isDirectory()) {
    throw new Error(`Dataset path must be a JSON file or directory: ${absolutePath}`);
  }

  const directoryDataset = loadDirectoryDataset(absolutePath);
  if (directoryDataset) {
    return {
      dataset: directoryDataset,
      sourcePath: absolutePath,
    };
  }

  const candidates = findDatasetFiles(absolutePath);
  if (!candidates.length) {
    throw new Error(
      `No crawl dataset found in ${absolutePath}. Run CRAWLER_OUTPUT_DIR=${absolutePath} npm run crawl:job first.`,
    );
  }

  candidates.sort((left, right) => fs.statSync(right).mtimeMs - fs.statSync(left).mtimeMs);
  return {
    dataset: readJsonFile(candidates[0]),
    sourcePath: candidates[0],
  };
}

function loadDirectoryDataset(directoryPath) {
  const metadataPath = path.join(directoryPath, "metadata.json");
  if (!fs.existsSync(metadataPath)) return null;

  const data = {};
  const entityNames = [
    "characters",
    "weapons",
    "artifacts",
    "ascension_materials",
    "enemies",
    "dungeons",
  ];

  for (const entityName of entityNames) {
    data[entityName] = readEntityRaw(directoryPath, entityName);
  }

  return {
    metadata: readJsonFile(metadataPath),
    data,
  };
}

function readEntityRaw(directoryPath, entityName) {
  const rawPath = path.join(directoryPath, entityName, "raw.json");
  if (!fs.existsSync(rawPath)) return [];

  const payload = readJsonFile(rawPath);
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  return [];
}

function readJsonFile(filePath) {
  const text = fs.readFileSync(filePath, "utf8");

  try {
    return JSON.parse(text);
  } catch (error) {
    const withoutTrailingCommas = text.replace(/,\s*([}\]])/g, "$1");
    if (withoutTrailingCommas !== text) {
      try {
        console.warn(`Recovered JSON with trailing commas: ${filePath}`);
        return JSON.parse(withoutTrailingCommas);
      } catch {
        // Fall through to the path-aware error below.
      }
    }

    throw new Error(`Invalid JSON in ${filePath}: ${error.message}`);
  }
}

function findDatasetFiles(directoryPath) {
  const entries = fs.readdirSync(directoryPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directoryPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...findDatasetFiles(entryPath));
      continue;
    }

    if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
    if (entry.name.endsWith("-game-data-crawl-job.json") || entry.name === "gi-crawl-job.json") {
      files.push(entryPath);
    }
  }

  if (files.length) return files;

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => path.join(directoryPath, entry.name));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
