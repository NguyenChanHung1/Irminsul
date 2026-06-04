// Weapon detail page
import { useRouter } from "next/router";
import Head from "next/head";
import { Weapon } from "../../types";

export default function WeaponDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const weapon = null as Weapon | null; // Will be fetched from API

  if (router.isFallback || !weapon) {
    return (
      <div className="page-container">
        <div className="loading">Loading weapon details...</div>
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
                <span className="value">— (from API)</span>
              </div>
              <div className="stat-row">
                <span>Sub Stat:</span>
                <span className="value">{weapon.main_stat}</span>
              </div>
            </div>
          </section>

          <section className="detail-section">
            <h2>Passive Effect</h2>
            <p>Passive details will be loaded from API</p>
          </section>

          <section className="detail-section">
            <h2>Recommended For</h2>
            <div className="recommendations">
              <p>Characters that benefit from this weapon will be listed here</p>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
