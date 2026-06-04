// Lore page
import Head from "next/head";

export default function LorePage() {
  return (
    <>
      <Head>
        <title>Lore | Irminsul</title>
      </Head>

      <div className="page-container lore-page">
        <div className="page-header">
          <h1>📖 Irminsul Lore</h1>
          <p>The story of the World Tree of Teyvat</p>
        </div>

        <section className="lore-section">
          <h2>The World Tree</h2>
          <p>
            Irminsul is the World Tree that connects all realms of Teyvat. Its ancient roots run deep beneath
            the land, and its luminous branches reach toward the heavens. It serves as a conduit between the
            physical world and the realm of the Abyss.
          </p>
        </section>

        <section className="lore-section">
          <h2>The Seven Elements</h2>
          <p>
            Through Irminsul flows the power of the seven elements: Pyro, Hydro, Electro, Cryo, Anemo, Geo,
            and Dendro. These elemental forces shape the fate of Teyvat and those who traverse it.
          </p>
        </section>

        <section className="lore-section">
          <h2>Spiral Abyss</h2>
          <p>
            The Spiral Abyss is a realm within Irminsul where brave adventurers test their strength against
            increasingly powerful foes. Each cycle brings new trials, new enemies, and new opportunities for glory.
          </p>
        </section>

        <section className="lore-section">
          <h2>The Stygian Onslaught</h2>
          <p>
            A temporary realm where players face unique formations and challenges. It is a place of endless
            combat where strategy and preparation determine success.
          </p>
        </section>
      </div>
    </>
  );
}
