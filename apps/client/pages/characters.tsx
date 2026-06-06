// Characters listing page
import { useEffect, useState } from "react";
import Head from "next/head";
import SearchInput from "../components/SearchInput";
import FilterBar from "../components/FilterBar";
import CharacterCard from "../components/CharacterCard";
import { Character, FilterOptions } from "../types";
import { PageMeta, api } from "../lib/api";

const PAGE_LIMIT = 40;
const characterFilters = [
  {
    key: "element" as const,
    label: "Element",
    options: ["Pyro", "Hydro", "Electro", "Cryo", "Anemo", "Geo", "Dendro"].map((value) => ({
      label: value,
      value,
    })),
  },
  {
    key: "weaponType" as const,
    label: "Weapon Type",
    options: ["Sword", "Claymore", "Polearm", "Bow", "Catalyst"].map((value) => ({
      label: value,
      value,
    })),
  },
  {
    key: "rarity" as const,
    label: "Rarity",
    options: [5, 4].map((value) => ({ label: `${value} star`, value })),
  },
];

export default function CharactersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({});
  const [characters, setCharacters] = useState<Character[]>([]);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    setIsLoading(true);
    setError(null);

    api
      .characters({
        q: searchQuery,
        element: filters.element,
        weaponType: filters.weaponType,
        rarity: filters.rarity,
        limit: PAGE_LIMIT,
      })
      .then((response) => {
        if (isCurrent) {
          setCharacters(response.data);
          setMeta(response.meta);
        }
      })
      .catch((err: Error) => {
        if (isCurrent) {
          setError(err.message);
          setCharacters([]);
          setMeta(null);
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [searchQuery, filters.element, filters.weaponType, filters.rarity]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  const handleLoadMore = () => {
    if (!meta || meta.page >= meta.totalPages || isLoadingMore) {
      return;
    }

    setIsLoadingMore(true);
    setError(null);

    api
      .characters({
        q: searchQuery,
        element: filters.element,
        weaponType: filters.weaponType,
        rarity: filters.rarity,
        page: meta.page + 1,
        limit: PAGE_LIMIT,
      })
      .then((response) => {
        setCharacters((current) => [...current, ...response.data]);
        setMeta(response.meta);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setIsLoadingMore(false));
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

        <FilterBar fields={characterFilters} onFilterChange={handleFilterChange} />

        <div className="characters-grid">
          {isLoading ? (
            <div className="loading">Loading characters...</div>
          ) : error ? (
            <div className="empty-state">
              <p>Unable to load characters</p>
              <p>{error}</p>
            </div>
          ) : characters.length > 0 ? (
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

        {meta && meta.page < meta.totalPages && (
          <div className="load-more-row">
            <button className="load-more-button" onClick={handleLoadMore} disabled={isLoadingMore}>
              {isLoadingMore ? "Loading..." : `Load more (${characters.length}/${meta.total})`}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
