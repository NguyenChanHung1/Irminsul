// Pick rates page
import { useState } from "react";
import Head from "next/head";
import DataTable, { Column } from "../components/DataTable";
import FilterBar from "../components/FilterBar";
import TierBadge from "../components/TierBadge";
import ChartContainer from "../components/ChartContainer";
import { CharacterStats, FilterOptions } from "../types";

export default function PickRatesPage() {
  const [filters, setFilters] = useState<FilterOptions>({});
  const [stats, setStats] = useState<CharacterStats[]>([]); // Will be fetched from API

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    // TODO: Call API with filters (patch, cycle, element, etc.)
  };

  const columns: Column<CharacterStats>[] = [
    {
      key: "character_id",
      label: "Character",
      width: "30%",
    },
    {
      key: "pick_rate",
      label: "Pick Rate",
      render: (value) => `${value.toFixed(2)}%`,
      sortable: true,
      width: "20%",
    },
    {
      key: "usage_rate",
      label: "Usage Rate",
      render: (value) => value ? `${value.toFixed(2)}%` : "—",
      sortable: true,
      width: "20%",
    },
    {
      key: "tier",
      label: "Tier",
      render: (value) => <TierBadge tier={value} />,
      width: "15%",
    },
  ];

  return (
    <>
      <Head>
        <title>Pick Rates | Irminsul</title>
      </Head>

      <div className="page-container">
        <div className="page-header">
          <h1>📊 Pick Rates</h1>
          <p>Detailed character usage statistics and rankings</p>
        </div>

        <FilterBar onFilterChange={handleFilterChange} />

        {/* Pick Rate Distribution Chart */}
        <ChartContainer title="Pick Rate Distribution">
          <div className="chart-placeholder">
            <p>📊 Distribution chart showing character pick rates will render here</p>
          </div>
        </ChartContainer>

        {/* Detailed Statistics Table */}
        <ChartContainer title="Character Statistics">
          <DataTable
            data={stats}
            columns={columns}
            emptyMessage="No statistics available for selected filters"
            onRowClick={(row) => {
              // TODO: Navigate to character detail
              console.log("Clicked character:", row.character_id);
            }}
          />
        </ChartContainer>

        {/* Tier Distribution */}
        <ChartContainer title="Tier Distribution">
          <div className="tier-grid">
            {["S+", "S", "A", "B", "C", "D"].map((tier) => (
              <div key={tier} className="tier-stat">
                <TierBadge tier={tier as any} size="medium" />
                <p className="count">— characters</p>
              </div>
            ))}
          </div>
        </ChartContainer>
      </div>
    </>
  );
}
