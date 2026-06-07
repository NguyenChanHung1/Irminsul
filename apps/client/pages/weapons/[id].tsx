import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Image from "next/image";
import { WeaponDetails, api } from "../../lib/api";
import {
  levelOptions,
  groupedMaterials,
  MaterialDisplayRow,
  formatWeaponSubStat,
  materialRows,
  refinementText,
  stripGameMarkup,
  weaponStatsAtLevel,
  weaponTypeIconUrl,
} from "../../lib/game-display";

function ascensionStageForLevel(level: number) {
  if (level <= 20) return "1";
  if (level <= 40) return "2";
  if (level <= 50) return "3";
  if (level <= 60) return "4";
  if (level <= 70) return "5";
  return "6";
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

export default function WeaponDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [weapon, setWeapon] = useState<WeaponDetails | null>(null);
  const [weaponLevel, setWeaponLevel] = useState(90);
  const [refinementRank, setRefinementRank] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady || typeof id !== "string") {
      return;
    }

    let isCurrent = true;
    setError(null);

    api
      .weapon(id)
      .then((response) => {
        if (isCurrent) {
          setWeapon(response);
        }
      })
      .catch((err: Error) => {
        if (isCurrent) {
          setError(err.message);
          setWeapon(null);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [id, router.isReady]);

  const weaponStats = useMemo(() => {
    return weapon ? weaponStatsAtLevel(weapon, weaponLevel) : [];
  }, [weapon, weaponLevel]);

  if (router.isFallback || !weapon) {
    return (
      <div className="page-container">
        <div className={error ? "empty-state" : "loading"}>
          {error || "Loading weapon details..."}
        </div>
      </div>
    );
  }

  const selectedMaterials =
    groupedMaterials(weapon.materials, ascensionStageForLevel(weaponLevel), "ascension").length > 0
      ? groupedMaterials(weapon.materials, ascensionStageForLevel(weaponLevel), "ascension")
      : materialRows(weapon.ascension_materials?.[ascensionStageForLevel(weaponLevel)]);
  const typeIcon = weaponTypeIconUrl(weapon.weapon_type, weapon.weapon_type_icon_url);
  const baseAttackAtLevel =
    weaponStats.find((stat) => stat.label === "Base ATK")?.value ?? weapon.base_attack ?? "-";

  return (
    <>
      <Head>
        <title>{weapon.name} | Irminsul</title>
      </Head>

      <div className="page-container weapon-detail resource-detail">
        <button className="back-button" onClick={() => router.back()}>
          Back
        </button>

        <section className="detail-hero-panel weapon-hero-panel">
          <div className="detail-art-panel weapon-art-panel">
            {weapon.image_url && (
              <Image src={weapon.image_url} alt={weapon.name} width={320} height={320} priority />
            )}
          </div>

          <div className="detail-summary-panel">
            <p className="detail-eyebrow">{weapon.location || "Weapon"}</p>
            <h1>{weapon.name}</h1>
            <p className="detail-description">{stripGameMarkup(weapon.description)}</p>

            <div className="detail-meta-grid">
              <span className={`rarity star-${weapon.rarity}`}>{"⭐".repeat(weapon.rarity)} Star</span>
              <span className="weapon-type">
                {typeIcon && <Image src={typeIcon} alt="" width={18} height={18} className="meta-icon" />}
                {weapon.weapon_type}
              </span>
              <span>Base ATK: {baseAttackAtLevel}</span>
              <span>Sub Stat: {formatWeaponSubStat(weapon.main_stat)}</span>
            </div>
          </div>
        </section>

        <section className="detail-section">
          <div className="section-title-row">
            <div>
              <h2>Level Attribute Scaling</h2>
              <p>Choose a level to inspect weapon attributes and ascension costs.</p>
            </div>
            <select value={weaponLevel} onChange={(event) => setWeaponLevel(Number(event.target.value))}>
              {levelOptions.map((level) => (
                <option key={level} value={level}>
                  Level {level}
                </option>
              ))}
            </select>
          </div>

          <div className="weapon-level-layout">
            <div className="stat-list-panel">
              {weaponStats.length ? (
                weaponStats.map((stat) => (
                  <div className="scaling-row" key={stat.label}>
                    <span>{stat.label}</span>
                    <strong>{stat.value}</strong>
                  </div>
                ))
              ) : (
                <p className="muted-copy">No level scaling data imported.</p>
              )}
            </div>

            <div className="material-list">
              {selectedMaterials.length ? (
                selectedMaterials.map((material) => (
                  <MaterialRow material={material} key={material.name} />
                ))
              ) : (
                <p className="muted-copy">No weapon material data imported.</p>
              )}
            </div>
          </div>
        </section>

        <section className="detail-section">
          <div className="section-title-row">
            <div>
              <h2>Refinement Effect</h2>
              {weapon.passive_name && <p>{weapon.passive_name}</p>}
            </div>
            <select value={refinementRank} onChange={(event) => setRefinementRank(Number(event.target.value))}>
              {[1, 2, 3, 4, 5].map((rank) => (
                <option key={rank} value={rank}>
                  R{rank}
                </option>
              ))}
            </select>
          </div>
          <p className="readable-copy">{refinementText(weapon.passive_description, refinementRank)}</p>
        </section>
      </div>
    </>
  );
}
