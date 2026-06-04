import Head from "next/head";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function Home() {
  return (
    <>
      <Head>
        <title>Irminsul — World Tree of Teyvat</title>
        <meta
          name="description"
          content="Irminsul frontend inspired by the world tree in Teyvat, with immersive fantasy theme and global navigation."
        />
      </Head>

      <section id="home" className="hero card">
        <p>Welcome to Irminsul</p>
        <h2>Rooted in ancient magic, reaching toward the skies.</h2>
        <p>
          Explore a fantasy-inspired portal into Teyvat’s world tree—where a luminous canopy, hidden lore, and mystical routes
          come together in a polished application layout.
        </p>
      </section>

      <section id="lore" className="card" style={{ marginTop: "2rem" }}>
        <h3>Irminsul Lore</h3>
        <p>
          The Irminsul is a living conduit between realms, a sacred tree of roots and constellations. Its emerald glow and
          ancient branches guide travelers through a realm of elemental adventure.
        </p>
      </section>

      <section id="explore" className="section-grid">
        <article className="section-card">
          <h3>Journey</h3>
          <p>Navigate the myths, regions, and hidden paths of Teyvat’s enchanted forest.</p>
        </article>
        <article className="section-card">
          <h3>Manifest</h3>
          <p>Build a mystical world around the tree theme with elegant design and immersive UI elements.</p>
        </article>
        <article className="section-card">
          <h3>Connect</h3>
          <p>Bridge frontend and backend systems through a coherent fantasy interface.</p>
        </article>
      </section>

      <section id="archives" className="card" style={{ marginTop: "2rem" }}>
        <h3>Archives</h3>
        <p>
          
        </p>
      </section>
    </>
  );
}
