// Items listing page
import { useState } from "react";
import Head from "next/head";
import SearchInput from "../components/SearchInput";
import FilterBar from "../components/FilterBar";
import ItemCard from "../components/ItemCard";
import { Item, FilterOptions } from "../types";

export default function ItemsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({});
  const [items, setItems] = useState<Item[]>([]); // Will be populated from API

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // TODO: Call API to search items
  };

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    // TODO: Call API to filter items
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

        <FilterBar onFilterChange={handleFilterChange} />

        <div className="items-grid">
          {items.length > 0 ? (
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
      </div>
    </>
  );
}
