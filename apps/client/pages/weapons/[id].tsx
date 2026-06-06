// Weapon detail page
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { WeaponDetails, api } from "../../lib/api";

export default function WeaponDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [weapon, setWeapon] = useState<WeaponDetails | null>(null);
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

  if (router.isFallback || !weapon) {
    return (
      <div className="page-container">
        <div className={error ? "empty-state" : "loading"}>
          {error || "Loading weapon details..."}
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{weapon.name} | Irminsul</title>
      </Head>

      <div className="page-container weapon-detail">
        <button className="back-button" onClick={() => router.back()}>
          ← Back
        </button>

        <div className="detail-header">
          <h1>{weapon.name}</h1>
          <span className={`rarity star-${weapon.rarity}`}>
            {"⭐".repeat(weapon.rarity)}
          </span>
        </div>

        <div className="detail-grid">
          <section className="detail-section">
            <h2>Base Stats</h2>
            <div className="stats-list">
              <div className="stat-row">
                <span>ATK:</span>
                <span className="value">{weapon.base_attack ?? "-"}</span>
              </div>
              <div className="stat-row">
                <span>Sub Stat:</span>
                <span className="value">{weapon.main_stat}</span>
              </div>
            </div>
          </section>

          <section className="detail-section">
            <h2>Passive Effect</h2>
            {weapon.passive_name && <h3>{weapon.passive_name}</h3>}
            <p>{weapon.passive_description || "No passive details available."}</p>
          </section>

          <section className="detail-section">
            <h2>Source</h2>
            <div className="recommendations">
              <p>{weapon.location || weapon.description || "No source details available."}</p>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
