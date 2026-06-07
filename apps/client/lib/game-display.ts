const NS_ASSET_PROXY_PATH = "/ns-assets/";

function nsAssetUrl(tail: string) {
  return `${NS_ASSET_PROXY_PATH}${tail.replace(/^\/+/, "")}`;
}

const WEAPON_TYPE_ICONS: Record<string, string> = {
  Sword: nsAssetUrl("WEAPON_SWORD_ONE_HAND.webp"),
  Claymore: nsAssetUrl("WEAPON_CLAYMORE.webp"),
  Polearm: nsAssetUrl("WEAPON_POLE.webp"),
  Bow: nsAssetUrl("WEAPON_BOW.webp"),
  Catalyst: nsAssetUrl("WEAPON_CATALYST.webp"),
};

export type MaterialDisplayRow = {
  name: string;
  quantity: string | number;
  image_url?: string;
  rarity?: number;
};

export type StatDisplayRow = {
  label: string;
  value: string | number;
};

export const levelOptions = [1, 20, 40, 50, 60, 70, 80, 90];
export const talentLevelOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function weaponTypeIconUrl(weaponType?: string, explicitUrl?: string) {
  return explicitUrl || (weaponType ? WEAPON_TYPE_ICONS[weaponType] : undefined);
}

export function stripGameMarkup(value?: string | null) {
  return String(value || "")
    .replace(/<color=#[A-Fa-f0-9]+>/g, "")
    .replace(/<\/color>/g, "")
    .replace(/<i>/g, "")
    .replace(/<\/i>/g, "")
    .replace(/\{LINK#[^}]+}/g, "")
    .replace(/\{\/LINK}/g, "")
    .replace(/\\n/g, "\n")
    .trim();
}

export function formatStatKey(key: string) {
  return key
    .replace(/^fight_prop_/i, "")
    .replace(/^base_/i, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatNumber(value: unknown, fractionDigits = 0) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "-";
  }

  return value.toLocaleString(undefined, {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: 0,
  });
}

export function formatScalingValue(value: unknown, format?: string) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "-";
  }

  const fractionMatch = format?.match(/F(\d+)/);
  const fractionDigits = fractionMatch ? Number(fractionMatch[1]) : 0;

  if (format?.includes("P")) {
    return `${(value * 100).toFixed(fractionDigits)}%`;
  }

  if (format?.includes("I")) {
    return Math.round(value).toLocaleString();
  }

  if (fractionMatch) {
    return value.toFixed(fractionDigits);
  }

  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function formatTalentScalingRow(raw: string, params: unknown[]) {
  const [label, pattern = ""] = raw.split("|");
  if (!label || !pattern) {
    return null;
  }

  const value = pattern.replace(/\{param(\d+):([^}]+)}/g, (_match, index, format) => {
    return formatScalingValue(params[Number(index) - 1], format);
  });

  return {
    label,
    value,
  };
}

export function talentPromoteEntry(talent: Record<string, any>, targetLevel: number) {
  const promote = talent.promote || {};
  return (
    Object.values(promote).find((entry: any) => entry?.level === targetLevel) ||
    promote[String(Math.max(targetLevel - 1, 0))] ||
    promote["0"]
  );
}

export function materialRows(value: unknown): MaterialDisplayRow[] {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map((entry: any) => ({
        name: entry?.name || entry?.material?.name || entry?.id || "Unknown material",
        quantity: entry?.value ?? entry?.count ?? entry?.quantity ?? "-",
        image_url: entry?.image_url || entry?.icon_url || entry?.iconUrl || entry?.material?.image_url,
        rarity: entry?.rarity ?? entry?.rank ?? entry?.material?.rarity,
      }))
      .filter((entry) => entry.name);
  }

  if (typeof value === "object") {
    return Object.entries(value as Record<string, any>).flatMap(([key, entry]) => {
      if (key === "cost") {
        return [{ name: "Mora", quantity: entry }];
      }

      if (key === "mats") {
        return materialRows(entry);
      }

      if (Array.isArray(entry)) {
        return materialRows(entry);
      }

      if (entry && typeof entry === "object") {
        return materialRows([entry]);
      }

      return [{ name: key, quantity: entry }];
    });
  }

  return [];
}

export function totalMaterialRows(rows: Array<Record<string, any>>): MaterialDisplayRow[] {
  const totals = new Map<string, MaterialDisplayRow>();

  rows.forEach((row) => {
    const name = row?.material?.name || row?.name;
    const quantity = Number(row?.quantity ?? row?.value ?? row?.count ?? 0);
    if (!name || !Number.isFinite(quantity)) {
      return;
    }
    const current = totals.get(name);
    totals.set(name, {
      name,
      quantity: Number(current?.quantity || 0) + quantity,
      image_url: current?.image_url || row?.material?.image_url || row?.image_url || row?.icon_url || row?.iconUrl,
      rarity: current?.rarity ?? row?.material?.rarity ?? row?.rarity ?? row?.rank,
    });
  });

  return Array.from(totals.values());
}

export function groupedMaterials(
  rows?: Array<Record<string, any>>,
  level?: string,
  source?: string,
): MaterialDisplayRow[] {
  return totalMaterialRows(
    (rows || []).filter((row) => {
      return (!level || row.level === level) && (!source || row.source === source);
    }),
  );
}

export function characterStatsAtLevel(character: {
  base_hp?: number | null;
  base_atk?: number | null;
  base_def?: number | null;
  crit_rate?: number | null;
  crit_dmg?: number | null;
  stats_modifier?: Record<string, any>;
}, level: number) {
  const modifiers = character.stats_modifier || {};
  const ascension = modifiers.ascension?.[characterAscensionPhase(level)] || {};
  const hp =
    (character.base_hp || 0) * Number(modifiers.hp?.[level] || 1) +
    Number(ascension.fight_prop_base_hp || 0);
  const atk =
    (character.base_atk || 0) * Number(modifiers.atk?.[level] || 1) +
    Number(ascension.fight_prop_base_attack || 0);
  const def =
    (character.base_def || 0) * Number(modifiers.def?.[level] || 1) +
    Number(ascension.fight_prop_base_defense || 0);
  const rows: StatDisplayRow[] = [
    { label: "Base HP", value: hp },
    { label: "Base ATK", value: atk },
    { label: "Base DEF", value: def },
  ];

  Object.entries(ascension)
    .filter(([key]) => !["fight_prop_base_hp", "fight_prop_base_attack", "fight_prop_base_defense"].includes(key))
    .forEach(([key, value]) => {
      rows.push({
        label: `Bonus ${formatFightPropKey(key)}`,
        value: formatFightPropValue(key, value),
      });
    });

  return rows;
}

function characterAscensionPhase(level: number) {
  if (level <= 20) return 0;
  if (level <= 40) return 1;
  if (level <= 50) return 2;
  if (level <= 60) return 3;
  if (level <= 70) return 4;
  return 5;
}

function weaponAscensionPhase(level: number) {
  if (level <= 20) return "0";
  if (level <= 40) return "1";
  if (level <= 50) return "2";
  if (level <= 60) return "3";
  if (level <= 70) return "4";
  if (level <= 80) return "5";
  return "6";
}

export function formatFightPropKey(key: string) {
  const normalizedKey = key.toLowerCase();
  const labels: Record<string, string> = {
    atk: "Base ATK",
    fight_prop_base_attack: "Base ATK",
    fight_prop_attack: "ATK",
    fight_prop_attack_percent: "ATK%",
    fight_prop_defense: "DEF",
    fight_prop_defense_percent: "DEF%",
    fight_prop_hp: "HP",
    fight_prop_hp_percent: "HP%",
    fight_prop_critical: "CRIT Rate",
    fight_prop_critical_hurt: "CRIT DMG",
    fight_prop_charge_efficiency: "Energy Recharge",
    fight_prop_element_mastery: "Elemental Mastery",
    fight_prop_heal_add: "Healing Bonus",
    fight_prop_fire_add_hurt: "Pyro DMG Bonus",
    fight_prop_water_add_hurt: "Hydro DMG Bonus",
    fight_prop_elec_add_hurt: "Electro DMG Bonus",
    fight_prop_ice_add_hurt: "Cryo DMG Bonus",
    fight_prop_wind_add_hurt: "Anemo DMG Bonus",
    fight_prop_rock_add_hurt: "Geo DMG Bonus",
    fight_prop_grass_add_hurt: "Dendro DMG Bonus",
    fight_prop_physical_add_hurt: "Physical DMG Bonus",
  };

  return labels[normalizedKey] || formatStatKey(key);
}

export function formatFightPropValue(key: string, value: unknown) {
  const normalizedKey = key.toLowerCase();
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric)) {
    return "-";
  }

  if (
    normalizedKey.includes("critical") ||
    normalizedKey.includes("hurt") ||
    normalizedKey.includes("efficiency") ||
    normalizedKey.includes("heal") ||
    normalizedKey.includes("_percent")
  ) {
    return `${(numeric * 100).toFixed(1)}%`;
  }

  return formatNumber(numeric);
}

export function formatWeaponSubStat(stat?: string | null) {
  return stat ? formatFightPropKey(stat) : "-";
}

export function weaponStatsAtLevel(weapon: {
  stats_modifier?: Record<string, any>;
  main_stat?: string;
}, level: number) {
  const modifiers = weapon.stats_modifier || {};
  const ascension = modifiers.ascension?.[weaponAscensionPhase(level)] || {};

  return Object.entries(modifiers)
    .filter(([key]) => key !== "ascension")
    .map(([key, entry]: [string, any]) => {
      const base = Number(entry?.base || 0);
      const multiplier = Number(entry?.levels?.[level] || 1);
      const normalizedKey = key.toLowerCase();
      const isBaseAttack = normalizedKey === "atk" || normalizedKey === "fight_prop_base_attack";
      const ascensionBonus = isBaseAttack ? Number(ascension.fight_prop_base_attack || 0) : 0;
      const rawValue = base * multiplier + ascensionBonus;

      return {
        label: formatFightPropKey(key),
        value: isBaseAttack ? formatNumber(rawValue) : formatFightPropValue(key, rawValue),
      };
    })
    .sort((left, right) => {
      if (left.label === "Base ATK") return -1;
      if (right.label === "Base ATK") return 1;
      return left.label.localeCompare(right.label);
    });
}

export function refinementText(description: string | null | undefined, rank: number) {
  return stripGameMarkup(description).replace(
    /(\d+(?:\.\d+)?(?:\/\d+(?:\.\d+)?){4})(%?)/g,
    (match, values, suffix) => {
      const selected = String(values).split("/")[rank - 1];
      return selected ? `${selected}${suffix}` : match;
    },
  );
}
