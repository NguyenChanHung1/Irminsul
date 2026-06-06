const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const { loadRootEnv } = require("./load-root-env");

loadRootEnv();

const prisma = new PrismaClient();

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

function lookupId(value) {
  const id = slugify(value);
  return id || null;
}

async function upsertElement(name) {
  const id = lookupId(name);
  if (!id) return null;
  await prisma.element.upsert({
    where: { id },
    update: { name },
    create: { id, name },
  });
  return id;
}

async function upsertWeaponType(name) {
  const id = lookupId(name);
  if (!id) return null;
  await prisma.weaponType.upsert({
    where: { id },
    update: { name },
    create: { id, name },
  });
  return id;
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
  const materialId = cleanId(materialLike.id || slugify(materialLike.name));
  const name = materialLike.name || materialId;
  if (!materialId || !name) return null;

  const groupId = await upsertMaterialGroup(materialLike.group || materialLike.family);
  await prisma.material.upsert({
    where: { id: materialId },
    update: {
      slug: materialLike.slug || slugify(name),
      name,
      groupId,
      family: materialLike.family || null,
      rarity: materialLike.rarity ?? null,
      description: materialLike.description || null,
      source: jsonValue(materialLike.source, []),
      availability: jsonValue(materialLike.availability, []),
      iconName: materialLike.iconName || null,
      iconUrl: materialLike.icon_url || materialLike.iconUrl || null,
    },
    create: {
      id: materialId,
      slug: materialLike.slug || slugify(name),
      name,
      groupId,
      family: materialLike.family || null,
      rarity: materialLike.rarity ?? null,
      description: materialLike.description || null,
      source: jsonValue(materialLike.source, []),
      availability: jsonValue(materialLike.availability, []),
      iconName: materialLike.iconName || null,
      iconUrl: materialLike.icon_url || materialLike.iconUrl || null,
    },
  });
  return materialId;
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
    await ensureMaterial(material);
  }
}

async function importCharacters(characters) {
  for (const character of characters) {
    const elementId = await upsertElement(character.element);
    const weaponTypeId = await upsertWeaponType(character.weapon_type);
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
    const weaponTypeId = await upsertWeaponType(weapon.weapon_type);

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
        ascensionMaterialGroup: weapon.ascension_material_group || null,
        ascensionMaterials: jsonValue(weapon.ascension_materials, {}),
        statsModifier: jsonValue(weapon.stats_modifier, {}),
        story: jsonValue(weapon.story, []),
        iconName: weapon.iconName || null,
        iconUrl: weapon.icon_url || weapon.iconUrl || null,
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
        ascensionMaterialGroup: weapon.ascension_material_group || null,
        ascensionMaterials: jsonValue(weapon.ascension_materials, {}),
        statsModifier: jsonValue(weapon.stats_modifier, {}),
        story: jsonValue(weapon.story, []),
        iconName: weapon.iconName || null,
        iconUrl: weapon.icon_url || weapon.iconUrl || null,
      },
    });

    await syncWeaponMaterials(cleanId(weapon.id), weapon);
  }
}

async function importArtifacts(artifacts) {
  for (const artifact of artifacts) {
    await prisma.artifactSet.upsert({
      where: { id: cleanId(artifact.id) },
      update: {
        slug: artifact.slug || slugify(artifact.name),
        name: artifact.name,
        ranks: jsonValue(artifact.ranks, []),
        maxRarity: artifact.max_rarity ?? null,
        twoPieceBonus: artifact.two_piece_bonus || null,
        fourPieceBonus: artifact.four_piece_bonus || null,
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
    }

    for (const [key, child] of Object.entries(node)) {
      if (key === "mats") continue;
      const childLevel = level || key;
      if (Array.isArray(child)) {
        for (const mat of child) {
          if (mat && typeof mat === "object" && mat.name) {
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
  const datasetPath = process.argv[2] || process.env.CRAWL_DATASET_PATH;
  if (!datasetPath) {
    throw new Error("Pass a dataset path as argv[2] or set CRAWL_DATASET_PATH.");
  }

  const { dataset, sourcePath } = loadDataset(datasetPath);
  console.log(`Importing crawl dataset: ${sourcePath}`);
  const data = dataset.data || {};

  await importMetadata(dataset.metadata || {}, sourcePath);
  await importMaterials(asArray(data.ascension_materials));
  await importCharacters(asArray(data.characters));
  await importWeapons(asArray(data.weapons));
  await importArtifacts(asArray(data.artifacts));
  await importEnemies(asArray(data.enemies));
  await importDungeons(asArray(data.dungeons));

  console.log(
    JSON.stringify(
      {
        imported: {
          characters: asArray(data.characters).length,
          weapons: asArray(data.weapons).length,
          artifacts: asArray(data.artifacts).length,
          materials: asArray(data.ascension_materials).length,
          enemies: asArray(data.enemies).length,
          dungeons: asArray(data.dungeons).length,
        },
        dataset: sourcePath,
      },
      null,
      2,
    ),
  );
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
      dataset: JSON.parse(fs.readFileSync(absolutePath, "utf8")),
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
    dataset: JSON.parse(fs.readFileSync(candidates[0], "utf8")),
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
    metadata: JSON.parse(fs.readFileSync(metadataPath, "utf8")),
    data,
  };
}

function readEntityRaw(directoryPath, entityName) {
  const rawPath = path.join(directoryPath, entityName, "raw.json");
  if (!fs.existsSync(rawPath)) return [];

  const payload = JSON.parse(fs.readFileSync(rawPath, "utf8"));
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  return [];
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
