// Team compositions page
import { useState } from "react";
import Head from "next/head";
import DataTable, { Column } from "../components/DataTable";
import FilterBar from "../components/FilterBar";
import ChartContainer from "../components/ChartContainer";
import { TeamComposition, FilterOptions } from "../types";

export default function TeamsPage() {
  const [filters, setFilters] = useState<FilterOptions>({});
  const [teams, setTeams] = useState<TeamComposition[]>([]); // Will be fetched from API

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    // TODO: Call API with filters (patch, cycle, floor, etc.)
  };

  const columns: Column<TeamComposition>[] = [
    {
      key: "id",
      label: "Team Members",
      render: (_, team) =>
        team.characters.map((c) => c.name).join(" / "),
      width: "50%",
    },
    {
      key: "pick_rate",
      label: "Pick Rate",
      render: (value) => `${value.toFixed(2)}%`,
      sortable: true,
      width: "20%",
    },
    {
      key: "floor",
      label: "Floor",
      width: "15%",
    },
    {
      key: "cycle",
      label: "Cycle",
      width: "15%",
    },
  ];

  return (
    <>
      <Head>
        <title>Team Compositions | Irminsul</title>
      </Head>

      <div className="page-container">
        <div className="page-header">
          <h1>👥 Team Compositions</h1>
          <p>Most popular team builds and formations</p>
        </div>

        <FilterBar onFilterChange={handleFilterChange} />

        {/* Top Teams Overview */}
        <ChartContainer title="Top 5 Team Compositions">
          <div className="top-teams">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="team-card">
                <div className="team-rank">#{i + 1}</div>
                <div className="team-members">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="member-slot">
                      {j === 0 ? "🗡️" : "🛡️"}
                    </div>
                  ))}
                </div>
                <p className="team-pick-rate">— Pick Rate</p>
              </div>
            ))}
          </div>
        </ChartContainer>

        {/* Detailed Teams Table */}
        <ChartContainer title="All Team Statistics">
          <DataTable
            data={teams}
            columns={columns}
            emptyMessage="No team data available for selected filters"
          />
        </ChartContainer>

        {/* Role Distribution */}
        <ChartContainer title="Role Distribution in Top Teams">
          <div className="chart-placeholder">
            <p>📊 Pie chart showing DPS/Support/Sub-DPS/Healer distribution</p>
          </div>
        </ChartContainer>
      </div>
    </>
  );
}
