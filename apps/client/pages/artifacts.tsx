// Artifacts listing page
import { useEffect, useState } from "react";
import Head from "next/head";
import SearchInput from "../components/SearchInput";
import FilterBar from "../components/FilterBar";
import ItemCard from "../components/ItemCard";
import { Artifact, FilterOptions } from "../types";
import { PageMeta, api } from "../lib/api";

const PAGE_LIMIT = 40;
const artifactFilters = [
  {
    key: "rarity" as const,
    label: "Rarity",
    options: [5, 4, 3, 2, 1].map((value) => ({ label: `${value} star`, value })),
  },
];

export default function ArtifactsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({});
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    setIsLoading(true);
    setError(null);

    api
      .artifacts({
        q: searchQuery,
        rarity: filters.rarity,
        limit: PAGE_LIMIT,
      })
      .then((response) => {
        if (isCurrent) {
          setArtifacts(response.data);
          setMeta(response.meta);
        }
      })
      .catch((err: Error) => {
        if (isCurrent) {
          setError(err.message);
          setArtifacts([]);
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
  }, [searchQuery, filters.rarity]);

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
      .artifacts({
        q: searchQuery,
        rarity: filters.rarity,
        page: meta.page + 1,
        limit: PAGE_LIMIT,
      })
      .then((response) => {
        setArtifacts((current) => [...current, ...response.data]);
        setMeta(response.meta);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setIsLoadingMore(false));
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

        <FilterBar fields={artifactFilters} onFilterChange={handleFilterChange} />

        <div className="items-grid">
          {isLoading ? (
            <div className="loading">Loading artifacts...</div>
          ) : error ? (
            <div className="empty-state">
              <p>Unable to load artifacts</p>
              <p>{error}</p>
            </div>
          ) : artifacts.length > 0 ? (
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

        {meta && meta.page < meta.totalPages && (
          <div className="load-more-row">
            <button className="load-more-button" onClick={handleLoadMore} disabled={isLoadingMore}>
              {isLoadingMore ? "Loading..." : `Load more (${artifacts.length}/${meta.total})`}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
