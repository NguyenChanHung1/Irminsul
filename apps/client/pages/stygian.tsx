// Stygian Onslaught dashboard
import { useState } from "react";
import Head from "next/head";
import ChartContainer from "../components/ChartContainer";
import FilterBar from "../components/FilterBar";
import { FilterOptions } from "../types";

export default function StygianPage() {
  const [filters, setFilters] = useState<FilterOptions>({});

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    // TODO: Call API with filters
  };

  return (
    <>
      <Head>
        <title>Stygian Onslaught | Irminsul</title>
      </Head>

      <div className="page-container dashboard">
        <div className="page-header">
          <h1>🌑 Stygian Onslaught Dashboard</h1>
          <p>Event statistics, formations, and team compositions</p>
        </div>

        <FilterBar onFilterChange={handleFilterChange} />

        {/* Key Statistics */}
        <div className="stats-section">
          <ChartContainer title="Event Metrics">
            <div className="stats-grid">
              <div className="stat-box">
                <span className="label">Current Event</span>
                <span className="value">—</span>
              </div>
              <div className="stat-box">
                <span className="label">Total Participants</span>
                <span className="value">—</span>
              </div>
              <div className="stat-box">
                <span className="label">Average Score</span>
                <span className="value">—</span>
              </div>
            </div>
          </ChartContainer>
        </div>

        {/* Formation Analysis */}
        <ChartContainer title="Formation Pick Rates">
          <div className="chart-placeholder">
            <p>📊 Pie/Bar chart showing popular formations will render here</p>
          </div>
        </ChartContainer>

        {/* Character Usage */}
        <ChartContainer title="Character Usage Stats">
          <div className="chart-placeholder">
            <p>📊 Character distribution and stats will render here</p>
          </div>
        </ChartContainer>

        {/* Top Teams */}
        <ChartContainer title="Top Performing Teams">
          <div className="teams-list">
            <p>👥 List of highest-scoring team compositions will render here</p>
          </div>
        </ChartContainer>
      </div>
    </>
  );
}
