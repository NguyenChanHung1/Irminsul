/* Navigation & Routing Guide
   Routes Overview for Irminsul App */

/*
  ┌─────────────────────────────────────────────────────────────┐
  │                      ROOT & CORE PAGES                       │
  └─────────────────────────────────────────────────────────────┘
*/

/*
  / (Home)
  - Landing page with hero section
  - Navigation to all major sections
  - Featured content (top teams, trending characters)
  - File: pages/index.tsx
*/

/*
  /about
  - About Irminsul information
  - Feature overview
  - Credits and privacy info
  - File: pages/about.tsx
*/

/*
  /lore
  - Lore and story content
  - World tree narrative
  - Element information
  - File: pages/lore.tsx
*/

/*
  /profile
  - Current user/player profile
  - Character showcase
  - Stats and collection overview
  - File: pages/profile.tsx
*/

/*
  ┌─────────────────────────────────────────────────────────────┐
  │              SPRINT 2: DATABASE PAGES                        │
  │            (Characters, Weapons, Artifacts, Items)           │
  └─────────────────────────────────────────────────────────────┘
*/

/*
  /characters
  - List all characters
  - Filters: element, weapon type, rarity, region
  - Search functionality
  - File: pages/characters.tsx
  Component: CharacterCard
*/

/*
  /characters/[id]
  - Character detail page
  - Base stats, talents, skills
  - Recommended builds
  - Ascension materials
  - File: pages/characters/[id].tsx
*/

/*
  /weapons
  - List all weapons
  - Filters: weapon type, rarity, element
  - Search by name or property
  - File: pages/weapons.tsx
  Component: ItemCard
*/

/*
  /weapons/[id]
  - Weapon detail page
  - Base stats and passive effect
  - Recommended characters
  - Ascension path
  - File: pages/weapons/[id].tsx
*/

/*
  /artifacts
  - List all artifact sets
  - Filters: set name, rarity, main stat
  - Search functionality
  - File: pages/artifacts.tsx
  Component: ItemCard
*/

/*
  /artifacts/[id] (Optional)
  - Artifact set detail page
  - Set bonus information
  - Recommended builds
  - Farming locations
*/

/*
  /items
  - List all materials and collectibles
  - Filters by type (materials, foods, gadgets)
  - Search functionality
  - File: pages/items.tsx
  Component: ItemCard
*/

/*
  ┌─────────────────────────────────────────────────────────────┐
  │           SPRINT 3: ANALYTICS & DASHBOARDS                   │
  │     (Abyss, Stygian, Pick Rates, Team Compositions)          │
  └─────────────────────────────────────────────────────────────┘
*/

/*
  /abyss
  - Spiral Abyss dashboard
  - Current cycle statistics
  - Pick rates by floor/chamber
  - Top character rankings
  - Filters: patch, cycle, floor, chamber, character, element
  - File: pages/abyss.tsx
  Components: ChartContainer, DataTable, FilterBar, TierBadge
*/

/*
  /stygian
  - Stygian Onslaught dashboard
  - Event-specific statistics
  - Formation analysis
  - Character usage distribution
  - Top performing teams
  - File: pages/stygian.tsx
  Components: ChartContainer, FilterBar
*/

/*
  /pick-rates
  - Character pick rate statistics
  - Tier rankings (S+, S, A, B, C, D)
  - Usage rate analysis
  - Filters: patch, cycle, element, weapon type
  - Detailed data table
  - File: pages/pick-rates.tsx
  Components: DataTable, FilterBar, TierBadge, ChartContainer
*/

/*
  /teams
  - Team composition statistics
  - Top performing team combinations
  - Role distribution analysis
  - Filters: patch, cycle, floor, character
  - File: pages/teams.tsx
  Components: DataTable, FilterBar, ChartContainer
*/

/*
  ┌─────────────────────────────────────────────────────────────┐
  │           SPRINT 4: TOOLS & UTILITIES                        │
  │      (UID Search, Profile, Damage Simulator)                 │
  └─────────────────────────────────────────────────────────────┘
*/

/*
  /search
  - UID search page
  - Look up player profiles
  - View character showcase
  - Access player statistics
  - File: pages/search.tsx
  Components: SearchInput, ChartContainer
*/

/*
  /simulator
  - Damage calculation tool
  - Character and weapon selection
  - Artifact loadout configuration
  - Enemy and resistance settings
  - Attack sequence input
  - Damage output calculation and visualization
  - File: pages/simulator.tsx
  Components: ChartContainer
*/

/*
  ┌─────────────────────────────────────────────────────────────┐
  │             REUSABLE COMPONENTS MAPPING                       │
  └─────────────────────────────────────────────────────────────┘
*/

/* DataTable - Used in analytics pages for rankings and stats */
/* Location: components/DataTable.tsx */
/* Used in: /pick-rates, /teams, /abyss */

/* FilterBar - Multi-filter selection across the app */
/* Location: components/FilterBar.tsx */
/* Used in: /characters, /weapons, /artifacts, /items, /abyss, /pick-rates, /teams */

/* SearchInput - Search across database and profiles */
/* Location: components/SearchInput.tsx */
/* Used in: /characters, /weapons, /artifacts, /items, /search */

/* CharacterCard - Display character in grid or list */
/* Location: components/CharacterCard.tsx */
/* Used in: /characters, /profile, /search */

/* ItemCard - Display weapons, artifacts, items */
/* Location: components/ItemCard.tsx */
/* Used in: /weapons, /artifacts, /items */

/* StatCard - Display key metrics */
/* Location: components/StatCard.tsx */
/* Used in: /abyss, /stygian, dashboards */

/* ChartContainer - Wrapper for charts and data visualizations */
/* Location: components/ChartContainer.tsx */
/* Used in: All analytics pages, /simulator, /profile */

/* TierBadge - Display ranking tiers (S+, S, A, B, C, D) */
/* Location: components/TierBadge.tsx */
/* Used in: /pick-rates, /abyss, /stygian */

/*
  ┌─────────────────────────────────────────────────────────────┐
  │                  NAVIGATION STRUCTURE                        │
  │                    (See Layout.tsx)                          │
  └─────────────────────────────────────────────────────────────┘
*/

/*
  SIDEBAR NAVIGATION SECTIONS:

  CORE
  ├─ 🏠 Home (/)

  DATABASE
  ├─ 🗡️ Characters (/characters)
  ├─ ⚔️ Weapons (/weapons)
  ├─ ✨ Artifacts (/artifacts)
  └─ 📦 Items (/items)

  ANALYTICS
  ├─ ⚡ Spiral Abyss (/abyss)
  ├─ 🌑 Stygian Onslaught (/stygian)
  ├─ 📊 Pick Rates (/pick-rates)
  └─ 👥 Teams (/teams)

  TOOLS
  ├─ 🔍 UID Search (/search)
  └─ ⚙️ Simulator (/simulator)

  INFO
  ├─ ℹ️ About (/about)
  └─ 📖 Lore (/lore)

  PROFILE (Header)
  └─ 👤 Profile (/profile)
*/

/*
  ┌─────────────────────────────────────────────────────────────┐
  │                   FILTER OPTIONS BY PAGE                     │
  └─────────────────────────────────────────────────────────────┘
*/

/*
  /characters
  ├─ Element (Pyro, Hydro, Electro, Cryo, Anemo, Geo, Dendro)
  ├─ Weapon Type (Sword, Claymore, Polearm, Bow, Catalyst)
  ├─ Rarity (5⭐, 4⭐, 3⭐)
  └─ Region (Mondstadt, Liyue, Inazuma, Sumeru, Fontaine)

  /weapons
  ├─ Weapon Type
  ├─ Rarity
  └─ Element/Effect Type

  /artifacts
  ├─ Rarity
  ├─ Set Name
  └─ Main Stat Type

  /abyss, /stygian
  ├─ Patch (4.6, 4.7, etc.)
  ├─ Cycle
  ├─ Floor
  ├─ Chamber
  ├─ Character
  ├─ Element
  └─ Weapon Type

  /pick-rates
  ├─ Patch
  ├─ Cycle
  ├─ Element
  ├─ Weapon Type
  └─ Rarity
*/
