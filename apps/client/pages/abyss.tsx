// Spiral Abyss dashboard
import { useState } from "react";
import Head from "next/head";
import ChartContainer from "../components/ChartContainer";
import FilterBar from "../components/FilterBar";
import DataTable, { Column } from "../components/DataTable";
import TierBadge from "../components/TierBadge";
import { AbyssCycle, FilterOptions } from "../types";

export default function AbyssPage() {
  const [filters, setFilters] = useState<FilterOptions>({});
  const [cycles, setCycles] = useState<AbyssCycle[]>([]); // Will be fetched from API
  const [selectedCycle, setSelectedCycle] = useState<AbyssCycle | null>(null);

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    // TODO: Call API with filters (patch, cycle, chamber, character, element, weaponType)
  };

  return (
    <>
      <Head>
        <title>Spiral Abyss | Irminsul</title>
      </Head>

      <div className="page-container dashboard">
        <div className="page-header">
          <h1>⚡ Spiral Abyss Dashboard</h1>
          <p>Analyze Abyss statistics, pick rates, and team compositions</p>
        </div>

        <FilterBar onFilterChange={handleFilterChange} />

        {/* Key Statistics */}
        <div className="stats-section">
          <ChartContainer title="Current Cycle Stats">
            <div className="stats-grid">
              <div className="stat-box">
                <span className="label">Current Cycle</span>
                <span className="value">—</span>
              </div>
              <div className="stat-box">
                <span className="label">Total Clears</span>
                <span className="value">—</span>
              </div>
              <div className="stat-box">
                <span className="label">Most Used Character</span>
                <span className="value">—</span>
              </div>
            </div>
          </ChartContainer>
        </div>

        {/* Pick Rates Chart */}
        <ChartContainer
          title="Top Characters by Pick Rate"
          description="Most frequently used characters across all floors"
        >
          <div className="chart-placeholder">
            <p>📊 Bar chart showing top 10 characters by pick rate will render here</p>
          </div>
        </ChartContainer>

        {/* Floors Overview */}
        <ChartContainer title="Floors Overview">
          <div className="floors-grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="floor-card">
                <h4>Floor {9 + i}</h4>
                <div className="chambers">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="chamber">
                      <span>Chamber {j + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ChartContainer>

        {/* Detailed Statistics Table */}
        <ChartContainer title="Character Statistics">
          <div className="table-container">
            <p>📋 Table with character stats (pick rate, tier, etc.) will render here</p>
          </div>
        </ChartContainer>
      </div>
    </>
  );
}
