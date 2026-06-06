// Character detail page
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Image from "next/image";
import { CharacterDetails, api } from "../../lib/api";

export default function CharacterDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [character, setCharacter] = useState<CharacterDetails | null>(null);
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

  if (router.isFallback || !character) {
    return (
      <div className="page-container">
        <div className={error ? "empty-state" : "loading"}>
          {error || "Loading character details..."}
        </div>
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
                <span className="value">{character.base_hp ?? "-"}</span>
              </div>
              <div className="stat">
                <label>ATK</label>
                <span className="value">{character.base_atk ?? "-"}</span>
              </div>
              <div className="stat">
                <label>DEF</label>
                <span className="value">{character.base_def ?? "-"}</span>
              </div>
              <div className="stat">
                <label>Crit Rate</label>
                <span className="value">
                  {character.crit_rate !== undefined && character.crit_rate !== null
                    ? `${character.crit_rate}%`
                    : "-"}
                </span>
              </div>
            </div>
          </section>

          <section className="detail-section">
            <h2>Talents</h2>
            <div className="talents">
              {character.talents?.length ? (
                character.talents.map((talent, index) => (
                  <div className="talent" key={`${talent.name}-${index}`}>
                    <h3>{talent.name || `Talent ${index + 1}`}</h3>
                    <p>{talent.description || talent.unlock || "No description available."}</p>
                  </div>
                ))
              ) : (
                <div className="talent">
                  <h3>No talents found</h3>
                  <p>This import did not include talent data for this character.</p>
                </div>
              )}
            </div>
          </section>

          <section className="detail-section">
            <h2>Profile</h2>
            <div className="builds">
              <div className="build">
                <h3>{character.title || character.constellation || character.name}</h3>
                <p>{character.description || "No description available."}</p>
                {character.birthday && <p>Birthday: {character.birthday}</p>}
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
