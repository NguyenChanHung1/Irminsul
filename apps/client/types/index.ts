// Shared data models
export interface Character {
  id: string;
  slug?: string;
  name: string;
  rarity: number;
  element: string;
  weapon_type: string;
  region: string;
  affiliation?: string | null;
  title?: string | null;
  release_date?: string | null;
  image_url?: string;
  element_icon_url?: string;
  weapon_type_icon_url?: string;
}

export interface Weapon {
  id: string;
  slug?: string;
  name: string;
  rarity: number;
  weapon_type: string;
  main_stat: string;
  release_version?: string | null;
  image_url?: string;
  weapon_type_icon_url?: string;
}

export interface Artifact {
  id: string;
  slug?: string;
  name: string;
  rarity: number;
  set_name: string;
  main_stat: string;
  release_version?: string | null;
  image_url?: string;
}

export interface Item {
  id: string;
  slug?: string;
  name: string;
  rarity?: number;
  type: string;
  image_url?: string;
}

export interface Enemy {
  id: string;
  slug?: string;
  name: string;
  region?: string;
  enemy_type?: string;
  family?: string;
  description?: string;
  image_url?: string;
}

// Abyss and statistics
export interface AbyssFloor {
  floor: number;
  name: string;
  enemies: string[];
  pickRates?: Record<string, number>;
}

export interface AbyssCycle {
  cycle: number;
  startDate: string;
  endDate: string;
  floors: AbyssFloor[];
}

export interface CharacterStats {
  character_id: string;
  pick_rate: number;
  ban_rate?: number;
  usage_rate?: number;
  tier: 'S+' | 'S' | 'A' | 'B' | 'C' | 'D';
}

export interface TeamComposition {
  id: string;
  characters: Character[];
  pick_rate: number;
  floor: number;
  cycle: number;
}

// Profile and simulator
export interface PlayerProfile {
  uid: string;
  name: string;
  level: number;
  adventure_rank: number;
  characters: Character[];
  showcaseCharacters?: Character[];
}

export interface ArtifactLoadout {
  main_stat: string;
  substats: Record<string, number>;
  rarity: number;
}

export interface DamageSimulatorInput {
  character: Character;
  weapon: Weapon;
  artifacts: {
    head?: ArtifactLoadout;
    hands?: ArtifactLoadout;
    body?: ArtifactLoadout;
    feet?: ArtifactLoadout;
    orb?: ArtifactLoadout;
  };
  enemy: {
    name: string;
    level: number;
    resistance: Record<string, number>;
  };
  rotation: string[];
}

export interface FilterOptions {
  patch?: string;
  cycle?: number;
  chamber?: number;
  character?: string;
  element?: string;
  weaponType?: string;
  type?: string;
  rarity?: number;
}
