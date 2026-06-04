// Reusable filter bar component
import { ReactNode } from "react";
import { FilterOptions } from "../types";

interface FilterBarProps {
  onFilterChange: (filters: FilterOptions) => void;
  children?: ReactNode;
}

export default function FilterBar({ onFilterChange, children }: FilterBarProps) {
  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    // Will be connected to parent state
    const filters: FilterOptions = { [key]: value };
    onFilterChange(filters);
  };

  return (
    <div className="filter-bar">
      <div className="filter-controls">
        {children || (
          <>
            <div className="filter-group">
              <label>Patch</label>
              <select onChange={(e) => handleFilterChange("patch", e.target.value)}>
                <option value="">All Patches</option>
                <option value="4.6">4.6</option>
                <option value="4.7">4.7</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Element</label>
              <select onChange={(e) => handleFilterChange("element", e.target.value)}>
                <option value="">All Elements</option>
                <option value="Pyro">Pyro 🔥</option>
                <option value="Hydro">Hydro 💧</option>
                <option value="Electro">Electro ⚡</option>
                <option value="Cryo">Cryo ❄️</option>
                <option value="Anemo">Anemo 🌪️</option>
                <option value="Geo">Geo 🪨</option>
                <option value="Dendro">Dendro 🌿</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Rarity</label>
              <select onChange={(e) => handleFilterChange("rarity", parseInt(e.target.value) || undefined)}>
                <option value="">All Rarities</option>
                <option value="5">5⭐</option>
                <option value="4">4⭐</option>
                <option value="3">3⭐</option>
              </select>
            </div>

            <button className="reset-filters" onClick={() => onFilterChange({})}>
              Reset
            </button>
          </>
        )}
      </div>
    </div>
  );
}
