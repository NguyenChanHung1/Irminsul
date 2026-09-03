import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';

type ListQuery = {
  q?: string;
  rarity?: string;
  element?: string;
  weaponType?: string;
  type?: string;
  page?: string;
  limit?: string;
};

type PageMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type PageResult<T> = {
  data: T[];
  meta: PageMeta;
};

const DEFAULT_LIMIT = 48;
const MAX_LIMIT = 100;
const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const NS_ASSET_PROXY_PATH = '/ns-assets/';
const WEAPON_TYPE_ICON_URLS: Record<string, string> = {
  Sword: nsAssetUrl('WEAPON_SWORD_ONE_HAND.webp'),
  Claymore: nsAssetUrl('WEAPON_CLAYMORE.webp'),
  Polearm: nsAssetUrl('WEAPON_POLE.webp'),
  Bow: nsAssetUrl('WEAPON_BOW.webp'),
  Catalyst: nsAssetUrl('WEAPON_CATALYST.webp'),
};
const ELEMENT_ICON_URLS: Record<string, string> = {
};

function nsAssetUrl(tail: string) {
  return `${NS_ASSET_PROXY_PATH}${tail.replace(/^\/+/, '')}`;
}

function nsAssetBaseUrl() {
  return process.env.NS_ASSET_BASE_URL?.replace(/\/?$/, '/') || '';
}

@Injectable()
export class ResourcesService {
  constructor(private readonly prisma: PrismaService) {}

  async listCharacters(query: ListQuery) {
    const { page, limit, skip, take } = this.getPagination(query);
    const where: Prisma.CharacterWhereInput = {
      AND: [
        this.searchByName(query.q),
        this.rarityFilter(query.rarity),
        query.element ? { element: { name: { equals: query.element, mode: 'insensitive' } } } : {},
        query.weaponType
          ? { weaponType: { name: { equals: query.weaponType, mode: 'insensitive' } } }
          : {},
      ],
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.character.findMany({
        where,
        skip,
        take,
        orderBy: [{ releaseDate: { sort: 'desc', nulls: 'last' } }, { name: 'asc' }],
        include: {
          element: true,
          weaponType: true,
          nation: true,
        },
      }),
      this.prisma.character.count({ where }),
    ]);

    return this.page(
      rows.map((character) => ({
        id: character.id,
        slug: character.slug,
        name: character.name,
        rarity: this.characterRarity(character.name, character.rarity),
        element: character.element?.name ?? 'Unknown',
        weapon_type: character.weaponType?.name ?? 'Unknown',
        region: character.nation?.name ?? character.affiliation ?? 'Unknown',
        affiliation: character.affiliation,
        title: character.title,
        release_date: character.releaseDate,
        image_url: this.publicImageUrl(character.iconUrl),
        element_icon_url: this.publicLookupIconUrl(character.element?.iconUrl) || this.elementIconUrl(character.element?.name),
        weapon_type_icon_url: this.publicLookupIconUrl(character.weaponType?.iconUrl) || this.weaponTypeIconUrl(character.weaponType?.name),
      })),
      total,
      page,
      limit,
    );
  }

  async getCharacter(id: string) {
    const character = await this.prisma.character.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: {
        element: true,
        weaponType: true,
        nation: true,
        materialUsages: {
          include: { material: true },
          orderBy: [{ source: 'asc' }, { level: 'asc' }],
        },
      },
    });

    if (!character) {
      throw new NotFoundException(`Character "${id}" was not found.`);
    }

    return {
      id: character.id,
      slug: character.slug,
      name: character.name,
      rarity: this.characterRarity(character.name, character.rarity),
      element: character.element?.name ?? 'Unknown',
      weapon_type: character.weaponType?.name ?? 'Unknown',
      region: character.nation?.name ?? character.affiliation ?? 'Unknown',
      affiliation: character.affiliation,
      image_url: this.publicImageUrl(character.iconUrl),
      element_icon_url: this.publicLookupIconUrl(character.element?.iconUrl) || this.elementIconUrl(character.element?.name),
      weapon_type_icon_url: this.publicLookupIconUrl(character.weaponType?.iconUrl) || this.weaponTypeIconUrl(character.weaponType?.name),
      title: character.title,
      description: character.description,
      release_date: character.releaseDate,
      birthday: character.birthday,
      constellation: character.constellation,
      base_hp: character.baseHp,
      base_atk: character.baseAtk,
      base_def: character.baseDef,
      crit_rate: character.critRate,
      crit_dmg: character.critDmg,
      stats_modifier: character.statsModifier,
      ascension_materials: character.ascensionMaterials,
      talent_materials: character.talentMaterials,
      talents: character.talents,
      passive_talents: character.passiveTalents,
      constellations: character.constellations,
      materials: character.materialUsages.map((usage) => ({
        source: usage.source,
        quantity: usage.quantity,
        level: usage.level,
        material: this.materialSummary(usage.material),
      })),
    };
  }

  async listWeapons(query: ListQuery) {
    const { page, limit, skip, take } = this.getPagination(query);
    const where: Prisma.WeaponWhereInput = {
      AND: [
        this.searchByName(query.q),
        this.rarityFilter(query.rarity),
        query.weaponType
          ? { weaponType: { name: { equals: query.weaponType, mode: 'insensitive' } } }
          : {},
      ],
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.weapon.findMany({
        where,
        skip,
        take,
        orderBy: [
          { releaseOrder: { sort: 'desc', nulls: 'last' } },
          { rarity: 'desc' },
          { name: 'asc' },
        ],
        include: { weaponType: true },
      }),
      this.prisma.weapon.count({ where }),
    ]);

    return this.page(
      rows.map((weapon) => ({
        id: weapon.id,
        slug: weapon.slug,
        name: weapon.name,
        rarity: weapon.rarity ?? 0,
        weapon_type: weapon.weaponType?.name ?? 'Unknown',
        weapon_type_icon_url: this.publicLookupIconUrl(weapon.weaponType?.iconUrl) || this.weaponTypeIconUrl(weapon.weaponType?.name),
        main_stat: weapon.subStat ?? '',
        release_version: weapon.releaseVersion,
        image_url: this.publicImageUrl(weapon.iconUrl),
      })),
      total,
      page,
      limit,
    );
  }

  async getWeapon(id: string) {
    const weapon = await this.prisma.weapon.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: {
        weaponType: true,
        materialUsages: {
          include: { material: true },
          orderBy: [{ source: 'asc' }, { level: 'asc' }],
        },
      },
    });

    if (!weapon) {
      throw new NotFoundException(`Weapon "${id}" was not found.`);
    }

    return {
      id: weapon.id,
      slug: weapon.slug,
      name: weapon.name,
      rarity: weapon.rarity ?? 0,
      weapon_type: weapon.weaponType?.name ?? 'Unknown',
      weapon_type_icon_url: this.publicLookupIconUrl(weapon.weaponType?.iconUrl) || this.weaponTypeIconUrl(weapon.weaponType?.name),
      base_attack: weapon.baseAttack,
      main_stat: weapon.subStat ?? '',
      passive_name: weapon.passiveName,
      passive_description: weapon.passiveDescription,
      description: weapon.description,
      location: weapon.location,
      release_version: weapon.releaseVersion,
      ascension_material_group: weapon.ascensionMaterialGroup,
      ascension_materials: weapon.ascensionMaterials,
      stats_modifier: weapon.statsModifier,
      story: weapon.story,
      image_url: this.publicImageUrl(weapon.iconUrl),
      materials: weapon.materialUsages.map((usage) => ({
        source: usage.source,
        quantity: usage.quantity,
        level: usage.level,
        material: this.materialSummary(usage.material),
      })),
    };
  }

  async listArtifacts(query: ListQuery) {
    const { page, limit, skip, take } = this.getPagination(query);
    const where: Prisma.ArtifactSetWhereInput = {
      AND: [this.searchByName(query.q), this.maxRarityFilter(query.rarity)],
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.artifactSet.findMany({
        where,
        skip,
        take,
        orderBy: [
          { releaseOrder: { sort: 'desc', nulls: 'last' } },
          { maxRarity: 'desc' },
          { name: 'asc' },
        ],
      }),
      this.prisma.artifactSet.count({ where }),
    ]);

    return this.page(
      rows.map((artifact) => ({
        id: artifact.id,
        slug: artifact.slug,
        name: artifact.name,
        rarity: artifact.maxRarity ?? 0,
        set_name: artifact.name,
        main_stat: artifact.twoPieceBonus ?? '',
        release_version: artifact.releaseVersion,
        image_url: this.publicImageUrl(artifact.iconUrl),
      })),
      total,
      page,
      limit,
    );
  }

  async getArtifact(id: string) {
    const artifact = await this.prisma.artifactSet.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });

    if (!artifact) {
      throw new NotFoundException(`Artifact set "${id}" was not found.`);
    }

    return {
      id: artifact.id,
      slug: artifact.slug,
      name: artifact.name,
      rarity: artifact.maxRarity ?? 0,
      set_name: artifact.name,
      main_stat: artifact.twoPieceBonus ?? '',
      release_version: artifact.releaseVersion,
      image_url: this.publicImageUrl(artifact.iconUrl),
      two_piece_bonus: artifact.twoPieceBonus,
      four_piece_bonus: artifact.fourPieceBonus,
      set_bonuses: artifact.setBonuses,
      parts: this.artifactParts(artifact.parts),
      icon_name: artifact.iconName,
    };
  }

  async listItems(query: ListQuery) {
    const { page, limit, skip, take } = this.getPagination(query);
    const where: Prisma.ItemWhereInput = {
      AND: [
        query.q
          ? {
              OR: [
                this.searchByName(query.q),
                { type: { contains: query.q, mode: 'insensitive' } },
              ],
            }
          : {},
        this.rarityFilter(query.rarity),
        query.type ? { type: { equals: query.type, mode: 'insensitive' } } : {},
      ],
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.item.findMany({
        where,
        skip,
        take,
        orderBy: [{ rarity: 'desc' }, { type: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.item.count({ where }),
    ]);

    return this.page(rows.map((item) => this.itemSummary(item)), total, page, limit);
  }

  async getItem(id: string) {
    const item = await this.prisma.item.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });

    if (!item) {
      throw new NotFoundException(`Item "${id}" was not found.`);
    }

    const raw = this.asRecord(item.raw);

    return {
      ...this.itemSummary(item),
      icon_name: item.iconName,
      description: typeof raw.desc === 'string' ? raw.desc : null,
      effect: typeof raw.effect === 'string' ? raw.effect : null,
      source: Array.isArray(raw.source_list) ? raw.source_list : [],
      raw,
    };
  }

  async listMaterials(query: ListQuery) {
    const { page, limit, skip, take } = this.getPagination(query);
    const where: Prisma.MaterialWhereInput = {
      AND: [
        this.excludeNumericNames(),
        query.q
          ? {
              OR: [
                this.searchByName(query.q),
                { family: { contains: query.q, mode: 'insensitive' } },
                { group: { name: { contains: query.q, mode: 'insensitive' } } },
              ],
            }
          : {},
        this.rarityFilter(query.rarity),
        query.type
          ? {
              OR: [
                { family: { equals: query.type, mode: 'insensitive' } },
                { group: { name: { equals: query.type, mode: 'insensitive' } } },
              ],
            }
          : {},
      ],
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.material.findMany({
        where,
        skip,
        take,
        orderBy: [{ rarity: 'desc' }, { name: 'asc' }],
        include: { group: true },
      }),
      this.prisma.material.count({ where }),
    ]);

    return this.page(
      rows.map((material) => ({
        ...this.materialSummary(material),
        type: material.group?.name ?? material.family ?? 'Material',
      })),
      total,
      page,
      limit,
    );
  }

  async listEnemies(query: ListQuery) {
    const { page, limit, skip, take } = this.getPagination(query);
    const where: Prisma.EnemyWhereInput = {
      AND: [
        { NOT: { enemyType: { equals: 'FISH', mode: 'insensitive' } } },
        query.q
          ? {
              OR: [
                this.searchByName(query.q),
                { family: { contains: query.q, mode: 'insensitive' } },
                { region: { contains: query.q, mode: 'insensitive' } },
                { enemyType: { contains: query.q, mode: 'insensitive' } },
              ],
            }
          : {},
        query.type ? { enemyType: { equals: query.type, mode: 'insensitive' } } : {},
      ],
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.enemy.findMany({
        where,
        skip,
        take,
        orderBy: { name: 'asc' },
      }),
      this.prisma.enemy.count({ where }),
    ]);

    return this.page(
      rows.map((enemy) => ({
        id: enemy.id,
        slug: enemy.slug,
        name: enemy.name,
        region: enemy.region,
        enemy_type: enemy.enemyType,
        family: enemy.family,
        description: enemy.description,
        image_url: this.publicImageUrl(enemy.iconUrl),
      })),
      total,
      page,
      limit,
    );
  }

  async listDungeons(query: ListQuery) {
    const { page, limit, skip, take } = this.getPagination(query);
    const where: Prisma.DungeonWhereInput = {
      AND: [
        this.searchByName(query.q),
        query.type ? { domainType: { equals: query.type, mode: 'insensitive' } } : {},
      ],
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.dungeon.findMany({
        where,
        skip,
        take,
        orderBy: { name: 'asc' },
        include: { nation: true },
      }),
      this.prisma.dungeon.count({ where }),
    ]);

    return this.page(
      rows.map((dungeon) => ({
        ...dungeon,
        nation: dungeon.nation?.name ?? null,
      })),
      total,
      page,
      limit,
    );
  }

  private getPagination(query: ListQuery) {
    const page = this.clampInt(query.page, 1, 1, Number.MAX_SAFE_INTEGER);
    const limit = this.clampInt(query.limit, DEFAULT_LIMIT, 1, MAX_LIMIT);

    return {
      page,
      limit,
      skip: (page - 1) * limit,
      take: limit,
    };
  }

  private page<T>(data: T[], total: number, page: number, limit: number): PageResult<T> {
    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private clampInt(value: string | undefined, fallback: number, min: number, max: number) {
    const parsed = Number.parseInt(value ?? '', 10);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }
    return Math.min(Math.max(parsed, min), max);
  }

  private searchByName(q: string | undefined) {
    return q ? { name: { contains: q, mode: Prisma.QueryMode.insensitive } } : {};
  }

  private excludeNumericNames() {
    return {
      NOT: DIGITS.map((digit) => ({
        name: { startsWith: digit },
      })),
    };
  }

  private characterRarity(name: string, rarity: number | null) {
    return /^manekin(a)?$/i.test(name) ? 4 : rarity ?? 0;
  }

  private weaponTypeIconUrl(weaponType: string | undefined) {
    return weaponType ? WEAPON_TYPE_ICON_URLS[weaponType] : undefined;
  }

  private elementIconUrl(element: string | undefined) {
    return element ? ELEMENT_ICON_URLS[element] : undefined;
  }

  private publicImageUrl(url: string | null | undefined) {
    if (!url || url.includes('genshin.jmp.blue')) {
      return undefined;
    }

    if (url.startsWith(NS_ASSET_PROXY_PATH)) {
      return url;
    }

    const baseUrl = nsAssetBaseUrl();
    if (baseUrl && url.startsWith(baseUrl)) {
      return nsAssetUrl(url.slice(baseUrl.length));
    }

    return url;
  }

  private publicLookupIconUrl(url: string | null | undefined) {
    if (!url) {
      return undefined;
    }

    if (url.startsWith(NS_ASSET_PROXY_PATH)) {
      return url;
    }

    const baseUrl = nsAssetBaseUrl();
    if (baseUrl && url.startsWith(baseUrl)) {
      return nsAssetUrl(url.slice(baseUrl.length));
    }

    return url;
  }

  private artifactParts(parts: Prisma.JsonValue) {
    const slotLabels: Record<string, string> = {
      equip_bracer: 'Flower of Life',
      equip_necklace: 'Plume of Death',
      equip_shoes: 'Sands of Eon',
      equip_ring: 'Goblet of Eonothem',
      equip_dress: 'Circlet of Logos',
    };

    const rawParts =
      parts && typeof parts === 'object' && !Array.isArray(parts)
        ? (parts as Record<string, Record<string, unknown>>)
        : {};

    return Object.entries(slotLabels)
      .map(([slot, label]) => {
        const part = rawParts[slot] ?? {};
        const iconName = typeof part.icon === 'string' ? part.icon : undefined;

        return {
          slot,
          label,
          name: typeof part.name === 'string' ? part.name : label,
          description: typeof part.desc === 'string' ? part.desc : '',
          icon_name: iconName,
          image_url: iconName ? nsAssetUrl(`${iconName}.webp`) : undefined,
          story: part.story,
        };
      })
      .filter((part) => part.name || part.description || part.image_url);
  }

  private rarityFilter(rarity: string | undefined) {
    const parsed = Number.parseInt(rarity ?? '', 10);
    return Number.isFinite(parsed) ? { rarity: parsed } : {};
  }

  private maxRarityFilter(rarity: string | undefined) {
    const parsed = Number.parseInt(rarity ?? '', 10);
    return Number.isFinite(parsed) ? { maxRarity: parsed } : {};
  }

  private materialSummary(material: {
    id: string;
    slug: string;
    name: string;
    rarity: number | null;
    family: string | null;
    iconUrl: string | null;
  }) {
    return {
      id: material.id,
      slug: material.slug,
      name: material.name,
      rarity: material.rarity ?? undefined,
      type: material.family ?? 'Material',
      image_url: this.publicImageUrl(material.iconUrl),
    };
  }

  private itemSummary(item: {
    id: string;
    slug: string;
    name: string;
    type: string | null;
    rarity: number | null;
    iconUrl: string | null;
  }) {
    return {
      id: item.id,
      slug: item.slug,
      name: item.name,
      rarity: item.rarity ?? undefined,
      type: item.type ?? 'Item',
      image_url: this.publicImageUrl(item.iconUrl),
    };
  }

  private asRecord(value: Prisma.JsonValue): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
  }
}
