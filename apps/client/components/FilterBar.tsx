// Reusable filter bar component
import { ReactNode, useState } from "react";
import { FilterOptions } from "../types";

export type FilterField = {
  key: keyof FilterOptions;
  label: string;
  options: Array<{
    label: string;
    value: string | number;
  }>;
};

interface FilterBarProps {
  onFilterChange: (filters: FilterOptions) => void;
  fields?: FilterField[];
  children?: ReactNode;
}

const defaultFields: FilterField[] = [
  {
    key: "element",
    label: "Element",
    options: [
      { label: "Pyro", value: "Pyro" },
      { label: "Hydro", value: "Hydro" },
      { label: "Electro", value: "Electro" },
      { label: "Cryo", value: "Cryo" },
      { label: "Anemo", value: "Anemo" },
      { label: "Geo", value: "Geo" },
      { label: "Dendro", value: "Dendro" },
    ],
  },
  {
    key: "rarity",
    label: "Rarity",
    options: [
      { label: "5 star", value: 5 },
      { label: "4 star", value: 4 },
      { label: "3 star", value: 3 },
    ],
  },
];

export default function FilterBar({
  onFilterChange,
  fields = defaultFields,
  children,
}: FilterBarProps) {
  const [filters, setFilters] = useState<FilterOptions>({});

  const allLabel = (label: string) => {
    if (label.endsWith("y")) {
      return `All ${label.slice(0, -1)}ies`;
    }

    return `All ${label}s`;
  };

  const normalizeValue = (key: keyof FilterOptions, value: string) => {
    if (!value) {
      return undefined;
    }

    return key === "rarity" || key === "cycle" || key === "chamber"
      ? Number(value)
      : value;
  };

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    const nextFilters = {
      ...filters,
      [key]: normalizeValue(key, value),
    };

    Object.keys(nextFilters).forEach((filterKey) => {
      const typedKey = filterKey as keyof FilterOptions;
      if (nextFilters[typedKey] === undefined || nextFilters[typedKey] === "") {
        delete nextFilters[typedKey];
      }
    });

    setFilters(nextFilters);
    onFilterChange(nextFilters);
  };

  const resetFilters = () => {
    setFilters({});
    onFilterChange({});
  };

  return (
    <div className="filter-bar">
      <div className="filter-controls">
        {children || (
          <>
            {fields.map((field) => (
              <div className="filter-group" key={field.key}>
                <label>{field.label}</label>
                <select
                  value={String(filters[field.key] ?? "")}
                  onChange={(e) => handleFilterChange(field.key, e.target.value)}
                >
                  <option value="">{allLabel(field.label)}</option>
                  {field.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}

            <button className="reset-filters" onClick={resetFilters}>
              Reset
            </button>
          </>
        )}
      </div>
    </div>
  );
}
