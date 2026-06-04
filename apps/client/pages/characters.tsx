// Characters listing page
import { useState } from "react";
import Head from "next/head";
import SearchInput from "../components/SearchInput";
import FilterBar from "../components/FilterBar";
import CharacterCard from "../components/CharacterCard";
import { Character, FilterOptions } from "../types";

export default function CharactersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({});
  const [characters, setCharacters] = useState<Character[]>([]); // Will be populated from API

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // TODO: Call API to search characters
  };

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    // TODO: Call API to filter characters
  };

  return (
    <>
      <Head>
        <title>Characters | Irminsul</title>
      </Head>

      <div className="page-container">
        <div className="page-header">
          <h1>⚔️ Characters</h1>
          <p>Browse all characters in Teyvat</p>
        </div>

        <SearchInput
          placeholder="Search by name, element, weapon..."
          onSearch={handleSearch}
        />

        <FilterBar onFilterChange={handleFilterChange} />

        <div className="characters-grid">
          {characters.length > 0 ? (
            characters.map((char) => (
              <CharacterCard key={char.id} character={char} />
            ))
          ) : (
            <div className="empty-state">
              <p>📭 No characters found</p>
              <p>Try adjusting your filters</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
