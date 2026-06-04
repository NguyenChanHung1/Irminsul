// Damage simulator page
import { useState } from "react";
import Head from "next/head";
import ChartContainer from "../components/ChartContainer";
import { DamageSimulatorInput, Character } from "../types";

export default function SimulatorPage() {
  const [simulatorInput, setSimulatorInput] = useState<DamageSimulatorInput>({
    character: {} as Character,
    weapon: {} as any,
    artifacts: {},
    enemy: { name: "", level: 90, resistance: {} },
    rotation: [],
  });
  const [results, setResults] = useState<any>(null);

  const handleSimulate = async () => {
    try {
      // TODO: Call API to run damage simulation
      // const response = await fetch("/api/simulate", {
      //   method: "POST",
      //   body: JSON.stringify(simulatorInput),
      // });
      // const data = await response.json();
      // setResults(data);
      console.log("Simulating:", simulatorInput);
    } catch (err) {
      console.error("Simulation failed:", err);
    }
  };

  return (
    <>
      <Head>
        <title>Damage Simulator | Irminsul</title>
      </Head>

      <div className="page-container simulator-page">
        <div className="page-header">
          <h1>⚙️ Damage Simulator</h1>
          <p>Calculate potential damage output with different builds</p>
        </div>

        <div className="simulator-layout">
          {/* Input Panel */}
          <div className="simulator-inputs">
            <ChartContainer title="Character Setup">
              <div className="form-group">
                <label>Select Character</label>
                <select>
                  <option>Choose a character...</option>
                  <option>Character 1</option>
                  <option>Character 2</option>
                </select>
              </div>

              <div className="form-group">
                <label>Character Level</label>
                <input type="number" placeholder="1-90" defaultValue={90} />
              </div>

              <div className="form-group">
                <label>Talent Levels</label>
                <div className="talent-inputs">
                  <input type="number" placeholder="Normal Attack" />
                  <input type="number" placeholder="Skill" />
                  <input type="number" placeholder="Burst" />
                </div>
              </div>
            </ChartContainer>

            <ChartContainer title="Equipment">
              <div className="form-group">
                <label>Weapon</label>
                <select>
                  <option>Select weapon...</option>
                </select>
              </div>

              <div className="form-group">
                <label>Weapon Level</label>
                <input type="number" placeholder="1-90" defaultValue={90} />
              </div>

              <div className="form-group">
                <label>Refinement</label>
                <select defaultValue={1}>
                  <option value={1}>R1</option>
                  <option value={2}>R2</option>
                  <option value={3}>R3</option>
                  <option value={4}>R4</option>
                  <option value={5}>R5</option>
                </select>
              </div>
            </ChartContainer>

            <ChartContainer title="Artifacts">
              <div className="artifacts-grid">
                {["Flower", "Feather", "Sands", "Goblet", "Circlet"].map((slot) => (
                  <div key={slot} className="artifact-slot">
                    <h4>{slot}</h4>
                    <select>
                      <option>Select set...</option>
                    </select>
                    <input type="text" placeholder="Main stat" />
                    <input type="text" placeholder="Substats" />
                  </div>
                ))}
              </div>
            </ChartContainer>

            <ChartContainer title="Stats">
              <div className="stats-inputs">
                <div className="stat-input">
                  <label>ATK</label>
                  <input type="number" placeholder="0" />
                </div>
                <div className="stat-input">
                  <label>Crit Rate</label>
                  <input type="number" placeholder="0%" />
                </div>
                <div className="stat-input">
                  <label>Crit Damage</label>
                  <input type="number" placeholder="0%" />
                </div>
                <div className="stat-input">
                  <label>Element Damage</label>
                  <input type="number" placeholder="0%" />
                </div>
              </div>
            </ChartContainer>

            <ChartContainer title="Enemy">
              <div className="form-group">
                <label>Enemy</label>
                <select>
                  <option>Select enemy...</option>
                  <option>Hilichurl</option>
                  <option>Ruin Guard</option>
                </select>
              </div>

              <div className="form-group">
                <label>Enemy Level</label>
                <input type="number" placeholder="1-100" defaultValue={90} />
              </div>

              <div className="form-group">
                <label>Resistance</label>
                <input type="number" placeholder="0%" defaultValue={10} />
              </div>
            </ChartContainer>

            <ChartContainer title="Attack Sequence">
              <div className="form-group">
                <label>Rotation</label>
                <textarea
                  placeholder="Enter attack sequence (e.g., N3C, E, Q, N5C)"
                  rows={4}
                />
              </div>
              <button className="simulate-button" onClick={handleSimulate}>
                🚀 Calculate Damage
              </button>
            </ChartContainer>
          </div>

          {/* Results Panel */}
          <div className="simulator-results">
            <ChartContainer title="Damage Results">
              {results ? (
                <div className="results-display">
                  <div className="result-row">
                    <span>Average Damage:</span>
                    <span className="value">— DPS</span>
                  </div>
                  <div className="result-row">
                    <span>Crit Damage:</span>
                    <span className="value">—</span>
                  </div>
                  <div className="result-row">
                    <span>Non-Crit Damage:</span>
                    <span className="value">—</span>
                  </div>
                  <div className="result-row">
                    <span>Reaction Damage:</span>
                    <span className="value">—</span>
                  </div>
                </div>
              ) : (
                <div className="no-results">
                  <p>💭 Enter your build and click "Calculate Damage" to see results</p>
                </div>
              )}
            </ChartContainer>

            <ChartContainer title="Damage Breakdown">
              <div className="chart-placeholder">
                <p>📊 Breakdown chart will render here</p>
              </div>
            </ChartContainer>

            <ChartContainer title="Comparison">
              <div className="comparison-options">
                <p>🔄 Compare different builds and strategies</p>
              </div>
            </ChartContainer>
          </div>
        </div>
      </div>
    </>
  );
}
