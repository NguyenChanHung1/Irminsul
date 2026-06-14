import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Image from "next/image";
import { ArtifactDetails, ArtifactPart, api } from "../../lib/api";
import { stripGameMarkup } from "../../lib/game-display";

function bonusRows(artifact: ArtifactDetails) {
  return [
    { label: "2-Piece", value: artifact.two_piece_bonus },
    { label: "4-Piece", value: artifact.four_piece_bonus },
  ].filter((row) => row.value);
}

function ArtifactPartCard({ part }: { part: ArtifactPart }) {
  return (
    <article className="artifact-part-card">
      {part.image_url && (
        <div className="artifact-part-image">
          <Image src={part.image_url} alt={part.name} width={96} height={96} />
        </div>
      )}
      <div>
        <p className="detail-eyebrow">{part.label}</p>
        <h3>{part.name}</h3>
        {part.description && <p className="readable-copy">{stripGameMarkup(part.description)}</p>}
      </div>
    </article>
  );
}

export default function ArtifactDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [artifact, setArtifact] = useState<ArtifactDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady || typeof id !== "string") {
      return;
    }

    let isCurrent = true;
    setError(null);

    api
      .artifact(id)
      .then((response) => {
        if (isCurrent) {
          setArtifact(response);
        }
      })
      .catch((err: Error) => {
        if (isCurrent) {
          setError(err.message);
          setArtifact(null);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [id, router.isReady]);

  const bonuses = useMemo(() => (artifact ? bonusRows(artifact) : []), [artifact]);

  if (router.isFallback || !artifact) {
    return (
      <div className="page-container">
        <div className={error ? "empty-state" : "loading"}>
          {error || "Loading artifact details..."}
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{artifact.name} | Irminsul</title>
      </Head>

      <div className="page-container artifact-detail resource-detail">
        <button className="back-button" onClick={() => router.back()}>
          Back
        </button>

        <section className="detail-hero-panel artifact-hero-panel">
          <div className="detail-art-panel artifact-art-panel">
            {artifact.image_url && (
              <Image src={artifact.image_url} alt={artifact.name} width={320} height={320} priority />
            )}
          </div>

          <div className="detail-summary-panel">
            <p className="detail-eyebrow">Artifact Set</p>
            <h1>{artifact.name}</h1>
            <p className="detail-description">
              {artifact.two_piece_bonus || artifact.four_piece_bonus || "No set bonus text imported."}
            </p>

            <div className="detail-meta-grid">
              <span className={`rarity star-${artifact.rarity}`}>{"⭐".repeat(artifact.rarity)} Star</span>
              <span>{artifact.parts?.length || 0} Pieces</span>
              {/* {artifact.icon_name && <span>Icon: {artifact.icon_name}</span>} */}
            </div>
          </div>
        </section>

        <section className="detail-section">
          <div className="section-title-row compact">
            <div>
              <h2>Set Bonuses</h2>
              <p>{artifact.name}</p>
            </div>
          </div>
          <div className="artifact-bonus-list">
            {bonuses.length ? (
              bonuses.map((bonus) => (
                <article className="artifact-bonus-row" key={bonus.label}>
                  <div className="artifact-bonus-label">
                    <span>{bonus.label}</span>
                    <strong>Bonus</strong>
                  </div>
                  <p>{stripGameMarkup(bonus.value)}</p>
                </article>
              ))
            ) : (
              <p className="muted-copy">No set bonus data imported.</p>
            )}
          </div>
        </section>

        <section className="detail-section">
          <div className="section-title-row compact">
            <div>
              <h2>Artifact Pieces</h2>
              <p>{artifact.parts?.length || 0} pieces in this set</p>
            </div>
          </div>
          <div className="artifact-parts-grid">
            {(artifact.parts || []).length ? (
              artifact.parts?.map((part) => <ArtifactPartCard part={part} key={part.slot} />)
            ) : (
              <p className="muted-copy">No artifact piece data imported.</p>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
