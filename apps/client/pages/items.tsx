// Items listing page
import { useEffect, useState } from "react";
import Head from "next/head";
import Image from "next/image";
import SearchInput from "../components/SearchInput";
import FilterBar from "../components/FilterBar";
import { Item, FilterOptions } from "../types";
import { PageMeta, api } from "../lib/api";

const PAGE_LIMIT = 40;
const itemFilters = [
  {
    key: "type" as const,
    label: "Type",
    options: [
      "Food",
      "Character and Weapon Enhancement Material",
      "Gadget",
      "Material",
      "Character Level-Up Material",
      "Weapon Ascension Material",
      "Cooking Ingredient",
      "Character Talent Material",
      "Fish",
      "Adventure Item",
      "Character Ascension Material",
      "Refinement Material",
      "Local Specialty (Mondstadt)",
      "Local Specialty (Liyue)",
      "Local Specialty (Inazuma)",
      "Local Specialty (Sumeru)",
      "Local Specialty (Fontaine)",
      "Local Specialty (Natlan)",
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
      .items({
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
      .items({
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

      <div className="page-container resource-browser">
        <div className="page-header resource-page-header">
          <div>
            <h1>Items</h1>
            <p>{meta ? `${meta.total} items` : "All materials and collectibles in Teyvat"}</p>
          </div>
        </div>

        <div className="resource-controls">
          <SearchInput
            placeholder="Search items..."
            onSearch={handleSearch}
          />

          <FilterBar fields={itemFilters} onFilterChange={handleFilterChange} />
        </div>

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
              <a
                className="item-card catalog-item-card"
                key={item.id}
                href={`/items/${item.id}`}
              >
                {item.image_url && (
                  <div className="item-image catalog-item-image">
                    <Image src={item.image_url} alt={item.name} width={160} height={160} priority />
                  </div>
                )}
                <div className="item-info catalog-item-info">
                  <h4>{item.name}</h4>
                  <div className="catalog-item-meta">
                    {item.rarity ? (
                      <span className={`rarity star-${item.rarity}`}>{"⭐".repeat(item.rarity)}</span>
                    ) : (
                      <span className="item-rank-chip">Rank 0</span>
                    )}
                    <span className="item-type-chip">{item.type}</span>
                  </div>
                </div>
              </a>
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
