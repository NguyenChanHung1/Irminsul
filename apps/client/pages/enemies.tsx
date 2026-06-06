import { useEffect, useState } from "react";
import Head from "next/head";
import SearchInput from "../components/SearchInput";
import FilterBar from "../components/FilterBar";
import { PageMeta, api } from "../lib/api";
import { Enemy, FilterOptions } from "../types";

const PAGE_LIMIT = 40;
const enemyFilters = [
  {
    key: "type" as const,
    label: "Type",
    options: ["Monster", "Elite", "Boss", "Weekly Boss"].map((value) => ({
      label: value,
      value,
    })),
  },
];

export default function EnemiesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({});
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    setIsLoading(true);
    setError(null);

    api
      .enemies({
        q: searchQuery,
        type: filters.type,
        limit: PAGE_LIMIT,
      })
      .then((response) => {
        if (isCurrent) {
          setEnemies(response.data);
          setMeta(response.meta);
        }
      })
      .catch((err: Error) => {
        if (isCurrent) {
          setError(err.message);
          setEnemies([]);
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
  }, [searchQuery, filters.type]);

  const handleLoadMore = () => {
    if (!meta || meta.page >= meta.totalPages || isLoadingMore) {
      return;
    }

    setIsLoadingMore(true);
    setError(null);

    api
      .enemies({
        q: searchQuery,
        type: filters.type,
        page: meta.page + 1,
        limit: PAGE_LIMIT,
      })
      .then((response) => {
        setEnemies((current) => [...current, ...response.data]);
        setMeta(response.meta);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setIsLoadingMore(false));
  };

  return (
    <>
      <Head>
        <title>Enemies | Irminsul</title>
      </Head>

      <div className="page-container">
        <div className="page-header">
          <h1>Enemies</h1>
          <p>Browse enemy records, families, regions, and drops.</p>
        </div>

        <SearchInput placeholder="Search by name, family, region..." onSearch={setSearchQuery} />

        <FilterBar fields={enemyFilters} onFilterChange={setFilters} />

        <div className="items-grid">
          {isLoading ? (
            <div className="loading">Loading enemies...</div>
          ) : error ? (
            <div className="empty-state">
              <p>Unable to load enemies</p>
              <p>{error}</p>
            </div>
          ) : enemies.length > 0 ? (
            enemies.map((enemy) => (
              <article className="item-card enemy-card" key={enemy.id}>
                {enemy.image_url && (
                  <div className="item-image">
                    <img src={enemy.image_url} alt={enemy.name} />
                  </div>
                )}
                <div className="item-info">
                  <h4>{enemy.name}</h4>
                  <p className="item-type">{enemy.enemy_type || enemy.family || "Enemy"}</p>
                  {enemy.region && <p className="main-stat">{enemy.region}</p>}
                  {enemy.description && <p className="card-description">{enemy.description}</p>}
                </div>
              </article>
            ))
          ) : (
            <div className="empty-state">
              <p>No enemies found</p>
            </div>
          )}
        </div>

        {meta && meta.page < meta.totalPages && (
          <div className="load-more-row">
            <button className="load-more-button" onClick={handleLoadMore} disabled={isLoadingMore}>
              {isLoadingMore ? "Loading..." : `Load more (${enemies.length}/${meta.total})`}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
