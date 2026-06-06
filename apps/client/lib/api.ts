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
  talents?: Array<{ name?: string; description?: string; unlock?: string }>;
  passive_talents?: Array<{ name?: string; description?: string; unlock?: string }>;
  constellations?: Array<{ name?: string; description?: string; level?: number }>;
};

export type WeaponDetails = Weapon & {
  slug: string;
  base_attack?: number | null;
  passive_name?: string | null;
  passive_description?: string | null;
  description?: string | null;
  location?: string | null;
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
  materials: (query?: ResourceQuery) => request<PageResponse<Item>>("/api/materials", query),
  enemies: (query?: ResourceQuery) => request<PageResponse<Enemy>>("/api/enemies", query),
};
