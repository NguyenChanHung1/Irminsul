// Character detail page
import { useRouter } from "next/router";
import Head from "next/head";
import Image from "next/image";
import { Character } from "../../types";

export default function CharacterDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const character = null as Character | null; // Will be fetched from API based on `id`

  if (router.isFallback || !character) {
    return (
      <div className="page-container">
        <div className="loading">Loading character details...</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{character.name} | Irminsul</title>
      </Head>

      <div className="page-container character-detail">
        <button className="back-button" onClick={() => router.back()}>
          ← Back
        </button>

        {/* Character Hero Section */}
        <div className="character-hero">
          {character.image_url && (
            <Image
              src={character.image_url}
              alt={character.name}
              width={400}
              height={500}
              priority
            />
          )}
          <div className="character-header-info">
            <h1>{character.name}</h1>
            <div className="character-meta">
              <span className={`rarity star-${character.rarity}`}>
                {"⭐".repeat(character.rarity)} Star
              </span>
              <span className={`element element-${character.element.toLowerCase()}`}>
                {character.element} Element
              </span>
            </div>
            <p className="weapon-type">Weapon: {character.weapon_type}</p>
            <p className="region">Region: {character.region}</p>
          </div>
        </div>

        {/* Details Grid */}
        <div className="detail-grid">
          <section className="detail-section">
            <h2>Base Stats</h2>
            <div className="stats-grid">
              <div className="stat">
                <label>HP</label>
                <span className="value">— (Will load from API)</span>
              </div>
              <div className="stat">
                <label>ATK</label>
                <span className="value">—</span>
              </div>
              <div className="stat">
                <label>DEF</label>
                <span className="value">—</span>
              </div>
              <div className="stat">
                <label>Crit Rate</label>
                <span className="value">—</span>
              </div>
            </div>
          </section>

          <section className="detail-section">
            <h2>Talents</h2>
            <div className="talents">
              <div className="talent">
                <h3>Normal Attack</h3>
                <p>Description will be loaded from API</p>
              </div>
              <div className="talent">
                <h3>Elemental Skill</h3>
                <p>Description will be loaded from API</p>
              </div>
              <div className="talent">
                <h3>Elemental Burst</h3>
                <p>Description will be loaded from API</p>
              </div>
            </div>
          </section>

          <section className="detail-section">
            <h2>Recommended Builds</h2>
            <div className="builds">
              <div className="build">
                <h3>Main Build</h3>
                <p>Weapon: —</p>
                <p>Artifacts: —</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
