// Weapons listing page
import { useState } from "react";
import Head from "next/head";
import SearchInput from "../components/SearchInput";
import FilterBar from "../components/FilterBar";
import ItemCard from "../components/ItemCard";
import { Weapon, FilterOptions } from "../types";

export default function WeaponsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({});
  const [weapons, setWeapons] = useState<Weapon[]>([]); // Will be populated from API

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // TODO: Call API to search weapons
  };

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    // TODO: Call API to filter weapons
  };

  return (
    <>
      <Head>
        <title>Weapons | Irminsul</title>
      </Head>

      <div className="page-container">
        <div className="page-header">
          <h1>⚔️ Weapons</h1>
          <p>Discover all weapons in Teyvat</p>
        </div>

        <SearchInput
          placeholder="Search by name, type..."
          onSearch={handleSearch}
        />

        <FilterBar onFilterChange={handleFilterChange} />

        <div className="items-grid">
          {weapons.length > 0 ? (
            weapons.map((weapon) => (
              <ItemCard
                key={weapon.id}
                id={weapon.id}
                name={weapon.name}
                rarity={weapon.rarity}
                type={weapon.weapon_type}
                mainStat={weapon.main_stat}
                image_url={weapon.image_url}
                href={`/weapons/${weapon.id}`}
              />
            ))
          ) : (
            <div className="empty-state">
              <p>📭 No weapons found</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
