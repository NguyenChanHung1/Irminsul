import { Artifact, Character, Enemy, Item, Weapon } from "../types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:3001";

export type PageMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PageResponse<T> = {
  data: T[];
  meta: PageMeta;
};

export type ResourceQuery = {
  q?: string;
  rarity?: number;
  element?: string;
  weaponType?: string;
  type?: string;
  page?: number;
  limit?: number;
};

export type CharacterDetails = Character & {
  slug: string;
  title?: string | null;
  description?: string | null;
  release_date?: string | null;
  birthday?: string | null;
  constellation?: string | null;
  base_hp?: number | null;
  base_atk?: number | null;
  base_def?: number | null;
  crit_rate?: number | null;
  crit_dmg?: number | null;
  stats_modifier?: Record<string, any>;
  ascension_materials?: Record<string, any>;
  talent_materials?: Record<string, any>;
  talents?: Array<Record<string, any>>;
  passive_talents?: Array<Record<string, any>>;
  constellations?: Array<Record<string, any>>;
  materials?: Array<Record<string, any>>;
};

export type WeaponDetails = Weapon & {
  slug: string;
  base_attack?: number | null;
  passive_name?: string | null;
  passive_description?: string | null;
  description?: string | null;
  location?: string | null;
  ascension_materials?: Record<string, any>;
  stats_modifier?: Record<string, any>;
  story?: Record<string, any> | Array<any>;
  materials?: Array<Record<string, any>>;
};

export type ArtifactPart = {
  slot: string;
  label: string;
  name: string;
  description?: string | null;
  icon_name?: string | null;
  image_url?: string;
  story?: Record<string, any>;
};

export type ArtifactDetails = Artifact & {
  slug: string;
  two_piece_bonus?: string | null;
  four_piece_bonus?: string | null;
  set_bonuses?: Record<string, any>;
  parts?: ArtifactPart[];
  icon_name?: string | null;
};

export type ItemDetails = Item & {
  slug: string;
  icon_name?: string | null;
  description?: string | null;
  effect?: string | null;
  source?: string[];
  raw?: Record<string, any>;
};

function buildUrl(path: string, query?: ResourceQuery) {
  const url = new URL(path, API_BASE_URL);

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

async function request<T>(path: string, query?: ResourceQuery): Promise<T> {
  const response = await fetch(buildUrl(path, query));

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  characters: (query?: ResourceQuery) =>
    request<PageResponse<Character>>("/api/characters", query),
  character: (id: string) => request<CharacterDetails>(`/api/characters/${id}`),
  weapons: (query?: ResourceQuery) => request<PageResponse<Weapon>>("/api/weapons", query),
  weapon: (id: string) => request<WeaponDetails>(`/api/weapons/${id}`),
  artifacts: (query?: ResourceQuery) =>
    request<PageResponse<Artifact>>("/api/artifacts", query),
  artifact: (id: string) => request<ArtifactDetails>(`/api/artifacts/${id}`),
  items: (query?: ResourceQuery) => request<PageResponse<Item>>("/api/items", query),
  item: (id: string) => request<ItemDetails>(`/api/items/${id}`),
  materials: (query?: ResourceQuery) => request<PageResponse<Item>>("/api/materials", query),
  enemies: (query?: ResourceQuery) => request<PageResponse<Enemy>>("/api/enemies", query),
};
