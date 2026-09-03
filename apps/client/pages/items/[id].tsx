import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Image from "next/image";
import { ItemDetails, api } from "../../lib/api";
import { stripGameMarkup } from "../../lib/game-display";

function displayFields(item: ItemDetails) {
  const raw = item.raw || {};
  return [
    { label: "Item ID", value: item.id },
    { label: "Type", value: item.type },
    { label: "Rank", value: item.rarity ?? 0 },
    { label: "Icon", value: item.icon_name },
    { label: "Source Key", value: raw.item_type },
    { label: "Material Type", value: raw.material_type },
  ].filter((field) => field.value !== undefined && field.value !== null && field.value !== "");
}

export default function ItemDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [item, setItem] = useState<ItemDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady || typeof id !== "string") {
      return;
    }

    let isCurrent = true;
    setError(null);

    api
      .item(id)
      .then((response) => {
        if (isCurrent) {
          setItem(response);
        }
      })
      .catch((err: Error) => {
        if (isCurrent) {
          setError(err.message);
          setItem(null);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [id, router.isReady]);

  const fields = useMemo(() => (item ? displayFields(item) : []), [item]);

  if (router.isFallback || !item) {
    return (
      <div className="page-container">
        <div className={error ? "empty-state" : "loading"}>
          {error || "Loading item details..."}
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{item.name} | Irminsul</title>
      </Head>

      <div className="page-container item-detail resource-detail">
        <button className="back-button" onClick={() => router.back()}>
          Back
        </button>

        <section className="detail-hero-panel item-hero-panel">
          <div className="detail-art-panel item-art-panel">
            {item.image_url && (
              <Image src={item.image_url} alt={item.name} width={280} height={280} priority />
            )}
          </div>

          <div className="detail-summary-panel">
            <p className="detail-eyebrow">{item.type || "Item"}</p>
            <h1>{item.name}</h1>
            <p className="detail-description">
              {stripGameMarkup(item.description || item.effect || "Catalog item from the current NS item dataset.")}
            </p>

            <div className="detail-meta-grid">
              {item.rarity ? (
                <span className={`rarity star-${item.rarity}`}>{"⭐".repeat(item.rarity)} Star</span>
              ) : (
                <span>Rank 0</span>
              )}
              <span>{item.type}</span>
            </div>
          </div>
        </section>

        <section className="detail-section">
          <div className="section-title-row compact">
            <div>
              <h2>Catalog Data</h2>
              <p>Fields imported from item.json</p>
            </div>
          </div>

          <div className="item-field-grid">
            {fields.map((field) => (
              <div className="item-field" key={field.label}>
                <span>{field.label}</span>
                <strong>{String(field.value)}</strong>
              </div>
            ))}
          </div>
        </section>

        {item.source && item.source.length > 0 && (
          <section className="detail-section">
            <h2>Sources</h2>
            <div className="item-source-list">
              {item.source.map((source) => (
                <span key={source}>{source}</span>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
