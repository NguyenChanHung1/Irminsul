import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Image from "next/image";
import { CharacterDetails, api } from "../../lib/api";
import {
  characterStatsAtLevel,
  formatNumber,
  formatTalentScalingRow,
  groupedMaterials,
  levelOptions,
  MaterialDisplayRow,
  materialRows,
  StatDisplayRow,
  stripGameMarkup,
  talentLevelOptions,
  talentPromoteEntry,
  totalMaterialRows,
} from "../../lib/game-display";

function targetAscensionKey(level: number) {
  if (level <= 20) return "level_20";
  if (level <= 40) return "level_40";
  if (level <= 50) return "level_50";
  if (level <= 60) return "level_60";
  if (level <= 70) return "level_70";
  return "level_80";
}

function talentMaterialsForLevel(character: CharacterDetails, level: number) {
  const totalRows = groupedMaterials(
    (character.materials || []).filter((row: any) => {
      const rowLevel = Number(String(row?.level || "").replace("level_", ""));
      return row?.source === "talent" && rowLevel >= 2 && rowLevel <= level;
    }),
    undefined,
    "talent",
  );
  if (totalRows.length) {
    return totalRows;
  }

  const rawRows = [];
  for (let currentLevel = 2; currentLevel <= level; currentLevel += 1) {
    rawRows.push(...materialRows(character.talent_materials?.[`level_${currentLevel}`]));
  }
  return totalMaterialRows(rawRows as any);
}

function MaterialRow({ material }: { material: MaterialDisplayRow }) {
  return (
    <div className={`material-row material-rarity-${material.rarity ?? "unknown"}`}>
      <span className="material-row-label">
        {material.image_url && (
          <Image src={material.image_url} alt="" width={30} height={30} className="material-icon" />
        )}
        {material.name}
      </span>
      <strong>{material.quantity}</strong>
    </div>
  );
}

function ScalingRows({ rows }: { rows: Array<StatDisplayRow | { label: string; value: string }> }) {
  return (
    <div className="scaling-table">
      {rows.length ? (
        rows.map((row) => (
          <div className="scaling-row" key={row.label}>
            <span>{row.label}</span>
            <strong>{typeof row.value === "number" ? formatNumber(row.value) : row.value}</strong>
          </div>
        ))
      ) : (
        <p className="muted-copy">No scaling rows imported.</p>
      )}
    </div>
  );
}

export default function CharacterDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [character, setCharacter] = useState<CharacterDetails | null>(null);
  const [characterLevel, setCharacterLevel] = useState(90);
  const [talentLevels, setTalentLevels] = useState<Record<number, number>>({});
  const [talentViews, setTalentViews] = useState<Record<number, "description" | "scaling">>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady || typeof id !== "string") {
      return;
    }

    let isCurrent = true;
    setError(null);

    api
      .character(id)
      .then((response) => {
        if (isCurrent) {
          setCharacter(response);
        }
      })
      .catch((err: Error) => {
        if (isCurrent) {
          setError(err.message);
          setCharacter(null);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [id, router.isReady]);

  const characterStats = useMemo(() => {
    return character ? characterStatsAtLevel(character, characterLevel) : [];
  }, [character, characterLevel]);

  if (router.isFallback || !character) {
    return (
      <div className="page-container">
        <div className={error ? "empty-state" : "loading"}>
          {error || "Loading character details..."}
        </div>
      </div>
    );
  }

  const ascensionRows =
    groupedMaterials(character.materials, targetAscensionKey(characterLevel), "ascension").length > 0
      ? groupedMaterials(character.materials, targetAscensionKey(characterLevel), "ascension")
      : materialRows(character.ascension_materials?.[targetAscensionKey(characterLevel)]);

  return (
    <>
      <Head>
        <title>{character.name} | Irminsul</title>
      </Head>

      <div className="page-container character-detail resource-detail">
        <button className="back-button" onClick={() => router.back()}>
          Back
        </button>

        <section className="detail-hero-panel">
          <div className="detail-art-panel">
            {character.image_url && (
              <Image src={character.image_url} alt={character.name} width={420} height={520} priority />
            )}
          </div>

          <div className="detail-summary-panel">
            <p className="detail-eyebrow">{character.title || "Character"}</p>
            <h1>{character.name}</h1>
            <p className="detail-description">{stripGameMarkup(character.description)}</p>

            <div className="detail-meta-grid">
              <span className={`rarity star-${character.rarity}`}>{"⭐".repeat(character.rarity)} Star</span>
              <span className={`element element-${character.element.toLowerCase()}`}>
                {character.element_icon_url && (
                  <Image src={character.element_icon_url} alt="" width={18} height={18} className="meta-icon" />
                )}
                {character.element}
              </span>
              <span className="weapon-type">
                {character.weapon_type_icon_url && (
                  <Image src={character.weapon_type_icon_url} alt="" width={18} height={18} className="meta-icon" />
                )}
                {character.weapon_type}
              </span>
              <span>{character.region}</span>
              <span>Affiliation: {character.affiliation || "-"}</span>
              <span>Title: {character.title || "-"}</span>
              <span>Constellation: {character.constellation || "-"}</span>
              <span>Birthday: {character.birthday || "-"}</span>
            </div>
          </div>
        </section>

        <section className="detail-section">
          <h2>Level Attribute Scaling</h2>
          <article className="talent-panel attribute-panel">
            <div className="talent-scaling-card">
              <div className="section-title-row compact">
                <div>
                  <h3>Character Attributes</h3>
                  <p className="muted-copy">Base stats use level curves plus ascension flat bonuses.</p>
                </div>
                <select value={characterLevel} onChange={(event) => setCharacterLevel(Number(event.target.value))}>
                  {levelOptions.map((level) => (
                    <option key={level} value={level}>
                      Lv. {level}
                    </option>
                  ))}
                </select>
              </div>
              <ScalingRows rows={characterStats} />
            </div>

            <div className="talent-material-card">
              <h3>Ascension Materials</h3>
              <div className="material-list">
                {ascensionRows.length ? (
                  ascensionRows.map((material) => (
                    <MaterialRow material={material} key={material.name} />
                  ))
                ) : (
                  <p className="muted-copy">No level material data imported.</p>
                )}
              </div>
            </div>
          </article>
        </section>

        <section className="detail-section">
          <h2>Talent Scaling</h2>
          <div className="talent-stack">
            {(character.talents || []).map((talent, index) => {
              const selectedLevel = talentLevels[index] || 10;
              const selectedView = talentViews[index] || "scaling";
              const promote = talentPromoteEntry(talent, selectedLevel);
              const rows = (promote?.desc || [])
                .map((row: string) => formatTalentScalingRow(row, promote?.param || []))
                .filter(Boolean);
              const materials = talentMaterialsForLevel(character, selectedLevel);

              return (
                <article className="talent-panel" key={`${talent.name}-${index}`}>
                  <div className="talent-scaling-card">
                    <div className="section-title-row compact">
                      <div>
                        <h3>{talent.name || `Talent ${index + 1}`}</h3>
                        <p className="muted-copy">{talent.type || `Talent ${index + 1}`}</p>
                      </div>
                      <div className="talent-controls">
                        <div className="segmented-control" aria-label="Talent view">
                          {(["scaling", "description"] as const).map((view) => (
                            <button
                              key={view}
                              type="button"
                              className={selectedView === view ? "active" : ""}
                              onClick={() =>
                                setTalentViews((current) => ({
                                  ...current,
                                  [index]: view,
                                }))
                              }
                            >
                              {view === "scaling" ? "Scaling" : "Description"}
                            </button>
                          ))}
                        </div>
                        <select
                          value={selectedLevel}
                          onChange={(event) =>
                            setTalentLevels((current) => ({
                              ...current,
                              [index]: Number(event.target.value),
                            }))
                          }
                        >
                          {talentLevelOptions.map((level) => (
                            <option key={level} value={level}>
                              Lv. {level}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {selectedView === "description" ? (
                      <p className="talent-description-copy">{stripGameMarkup(talent.desc)}</p>
                    ) : (
                      <ScalingRows rows={rows as Array<{ label: string; value: string }>} />
                    )}
                  </div>

                  <div className="talent-material-card">
                    <h3>Total Materials to Lv. {selectedLevel}</h3>
                    <div className="material-list">
                      {materials.length ? (
                        materials.map((material) => (
                          <MaterialRow material={material} key={material.name} />
                        ))
                      ) : (
                        <p className="muted-copy">No talent material data imported.</p>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="detail-section">
          <h2>Passive Talents</h2>
          <div className="info-card-grid vertical-info-stack">
            {(character.passive_talents || []).map((passive, index) => (
              <article className="info-card" key={`${passive.name}-${index}`}>
                <h3>{passive.name || `Passive ${index + 1}`}</h3>
                <p>{stripGameMarkup(passive.special_desc || passive.desc)}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="detail-section">
          <h2>Constellations</h2>
          <div className="info-card-grid constellation-grid vertical-info-stack">
            {(character.constellations || []).map((constellation, index) => (
              <article className="info-card" key={`${constellation.name}-${index}`}>
                <span className="constellation-index">C{index + 1}</span>
                <h3>{constellation.name || `Constellation ${index + 1}`}</h3>
                <p>{stripGameMarkup(constellation.special_desc || constellation.desc)}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
