// Weapons listing page
import { useEffect, useState } from "react";
import Head from "next/head";
import SearchInput from "../components/SearchInput";
import FilterBar from "../components/FilterBar";
import Image from "next/image";
import { Weapon, FilterOptions } from "../types";
import { PageMeta, api } from "../lib/api";
import { weaponTypeIconUrl } from "../lib/game-display";

const PAGE_LIMIT = 40;
const weaponFilters = [
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
    options: [5, 4, 3, 2, 1].map((value) => ({ label: `${value} star`, value })),
  },
];

export default function WeaponsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({});
  const [weapons, setWeapons] = useState<Weapon[]>([]);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    setIsLoading(true);
    setError(null);

    api
      .weapons({
        q: searchQuery,
        rarity: filters.rarity,
        weaponType: filters.weaponType,
        limit: PAGE_LIMIT,
      })
      .then((response) => {
        if (isCurrent) {
          setWeapons(response.data);
          setMeta(response.meta);
        }
      })
      .catch((err: Error) => {
        if (isCurrent) {
          setError(err.message);
          setWeapons([]);
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
  }, [searchQuery, filters.rarity, filters.weaponType]);

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
      .weapons({
        q: searchQuery,
        rarity: filters.rarity,
        weaponType: filters.weaponType,
        page: meta.page + 1,
        limit: PAGE_LIMIT,
      })
      .then((response) => {
        setWeapons((current) => [...current, ...response.data]);
        setMeta(response.meta);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setIsLoadingMore(false));
  };

  return (
    <>
      <Head>
        <title>Weapons | Irminsul</title>
      </Head>

      <div className="page-container resource-browser">
        <div className="page-header resource-page-header">
          <div>
            <h1>Weapons</h1>
            <p>{meta ? `${meta.total} weapons` : "Discover all weapons in Teyvat"}</p>
          </div>
        </div>

        <div className="resource-controls">
          <SearchInput
            placeholder="Search weapons..."
            onSearch={handleSearch}
          />

          <FilterBar fields={weaponFilters} onFilterChange={handleFilterChange} />
        </div>

        <div className="items-grid">
          {isLoading ? (
            <div className="loading">Loading weapons...</div>
          ) : error ? (
            <div className="empty-state">
              <p>Unable to load weapons</p>
              <p>{error}</p>
            </div>
          ) : weapons.length > 0 ? (
            weapons.map((weapon) => (
              <a className="item-card weapon-card" key={weapon.id} href={`/weapons/${weapon.id}`}>
                {weapon.image_url && (
                  <div className="item-image weapon-card-image">
                    <Image src={weapon.image_url} alt={weapon.name} width={160} height={160} priority />
                  </div>
                )}
                <div className="item-info weapon-card-info">
                  <h4>{weapon.name}</h4>
                  <div className="weapon-card-meta">
                    <span className={`rarity star-${weapon.rarity}`}>{"⭐".repeat(weapon.rarity)}</span>
                    {weaponTypeIconUrl(weapon.weapon_type, weapon.weapon_type_icon_url) && (
                      <span className="weapon-type-icon-chip" title={weapon.weapon_type}>
                        <Image
                          src={weaponTypeIconUrl(weapon.weapon_type, weapon.weapon_type_icon_url)!}
                          alt={weapon.weapon_type}
                          width={22}
                          height={22}
                        />
                      </span>
                    )}
                  </div>
                </div>
              </a>
            ))
          ) : (
            <div className="empty-state">
              <p>📭 No weapons found</p>
            </div>
          )}
        </div>

        {meta && meta.page < meta.totalPages && (
          <div className="load-more-row">
            <button className="load-more-button" onClick={handleLoadMore} disabled={isLoadingMore}>
              {isLoadingMore ? "Loading..." : `Load more (${weapons.length}/${meta.total})`}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
