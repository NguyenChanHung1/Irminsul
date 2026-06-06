// Items listing page
import { useEffect, useState } from "react";
import Head from "next/head";
import SearchInput from "../components/SearchInput";
import FilterBar from "../components/FilterBar";
import ItemCard from "../components/ItemCard";
import { Item, FilterOptions } from "../types";
import { PageMeta, api } from "../lib/api";

const PAGE_LIMIT = 40;
const itemFilters = [
  {
    key: "type" as const,
    label: "Type",
    options: [
      "Character EXP Materials",
      "Weapon Enhancement Materials",
      "Character Ascension Materials",
      "Talent Level-Up Materials",
      "Weapon Ascension Materials",
      "Enemy Drops",
      "Cooking Ingredients",
      "Local Specialty",
    ].map((value) => ({ label: value, value })),
  },
  {
    key: "rarity" as const,
    label: "Rarity",
    options: [5, 4, 3, 2, 1].map((value) => ({ label: `${value} star`, value })),
  },
];

export default function ItemsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({});
  const [items, setItems] = useState<Item[]>([]);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    setIsLoading(true);
    setError(null);

    api
      .materials({
        q: searchQuery,
        rarity: filters.rarity,
        type: filters.type,
        limit: PAGE_LIMIT,
      })
      .then((response) => {
        if (isCurrent) {
          setItems(response.data);
          setMeta(response.meta);
        }
      })
      .catch((err: Error) => {
        if (isCurrent) {
          setError(err.message);
          setItems([]);
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
  }, [searchQuery, filters.rarity, filters.type]);

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
      .materials({
        q: searchQuery,
        rarity: filters.rarity,
        type: filters.type,
        page: meta.page + 1,
        limit: PAGE_LIMIT,
      })
      .then((response) => {
        setItems((current) => [...current, ...response.data]);
        setMeta(response.meta);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setIsLoadingMore(false));
  };

  return (
    <>
      <Head>
        <title>Items | Irminsul</title>
      </Head>

      <div className="page-container">
        <div className="page-header">
          <h1>📦 Items</h1>
          <p>All materials and collectibles in Teyvat</p>
        </div>

        <SearchInput
          placeholder="Search by name, type..."
          onSearch={handleSearch}
        />

        <FilterBar fields={itemFilters} onFilterChange={handleFilterChange} />

        <div className="items-grid">
          {isLoading ? (
            <div className="loading">Loading items...</div>
          ) : error ? (
            <div className="empty-state">
              <p>Unable to load items</p>
              <p>{error}</p>
            </div>
          ) : items.length > 0 ? (
            items.map((item) => (
              <ItemCard
                key={item.id}
                id={item.id}
                name={item.name}
                type={item.type}
                image_url={item.image_url}
              />
            ))
          ) : (
            <div className="empty-state">
              <p>📭 No items found</p>
            </div>
          )}
        </div>

        {meta && meta.page < meta.totalPages && (
          <div className="load-more-row">
            <button className="load-more-button" onClick={handleLoadMore} disabled={isLoadingMore}>
              {isLoadingMore ? "Loading..." : `Load more (${items.length}/${meta.total})`}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
