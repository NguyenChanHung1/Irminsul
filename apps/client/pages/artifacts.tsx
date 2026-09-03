// Artifacts listing page
import { useEffect, useState } from "react";
import Head from "next/head";
import Image from "next/image";
import SearchInput from "../components/SearchInput";
import FilterBar from "../components/FilterBar";
import { Artifact, FilterOptions } from "../types";
import { PageMeta, api } from "../lib/api";

const PAGE_LIMIT = 40;
const artifactFilters = [
  {
    key: "rarity" as const,
    label: "Rarity",
    options: [5, 4, 3].map((value) => ({ label: `${value} star`, value })),
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

      <div className="page-container resource-browser">
        <div className="page-header resource-page-header">
          <div>
            <h1>Artifacts</h1>
            <p>{meta ? `${meta.total} artifact sets` : "Explore all artifact sets in Teyvat"}</p>
          </div>
        </div>

        <div className="resource-controls">
          <SearchInput
            placeholder="Search artifacts..."
            onSearch={handleSearch}
          />

          <FilterBar fields={artifactFilters} onFilterChange={handleFilterChange} />
        </div>

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
              <a
                className="item-card artifact-card"
                key={artifact.id}
                href={`/artifacts/${artifact.id}`}
              >
                {artifact.image_url && (
                  <div className="item-image artifact-card-image">
                    <Image src={artifact.image_url} alt={artifact.name} width={160} height={160} priority />
                  </div>
                )}
                <div className="item-info artifact-card-info">
                  <h4>{artifact.name}</h4>
                  <div className="artifact-card-meta">
                    <span className={`rarity star-${artifact.rarity}`}>{"⭐".repeat(artifact.rarity)}</span>
                    <span className="artifact-set-chip">Set</span>
                  </div>
                  {artifact.main_stat && <p className="artifact-card-bonus">{artifact.main_stat}</p>}
                </div>
              </a>
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
