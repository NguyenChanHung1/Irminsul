// Artifacts listing page
import { useState } from "react";
import Head from "next/head";
import SearchInput from "../components/SearchInput";
import FilterBar from "../components/FilterBar";
import ItemCard from "../components/ItemCard";
import { Artifact, FilterOptions } from "../types";

export default function ArtifactsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({});
  const [artifacts, setArtifacts] = useState<Artifact[]>([]); // Will be populated from API

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // TODO: Call API to search artifacts
  };

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    // TODO: Call API to filter artifacts
  };

  return (
    <>
      <Head>
        <title>Artifacts | Irminsul</title>
      </Head>

      <div className="page-container">
        <div className="page-header">
          <h1>✨ Artifacts</h1>
          <p>Explore all artifact sets in Teyvat</p>
        </div>

        <SearchInput
          placeholder="Search by name, set..."
          onSearch={handleSearch}
        />

        <FilterBar onFilterChange={handleFilterChange} />

        <div className="items-grid">
          {artifacts.length > 0 ? (
            artifacts.map((artifact) => (
              <ItemCard
                key={artifact.id}
                id={artifact.id}
                name={artifact.name}
                rarity={artifact.rarity}
                type={artifact.set_name}
                mainStat={artifact.main_stat}
                image_url={artifact.image_url}
                href={`/artifacts/${artifact.id}`}
              />
            ))
          ) : (
            <div className="empty-state">
              <p>📭 No artifacts found</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
