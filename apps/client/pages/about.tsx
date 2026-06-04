// About page
import Head from "next/head";

export default function AboutPage() {
  return (
    <>
      <Head>
        <title>About | Irminsul</title>
      </Head>

      <div className="page-container about-page">
        <div className="page-header">
          <h1>ℹ️ About Irminsul</h1>
        </div>

        <section className="about-section">
          <h2>What is Irminsul?</h2>
          <p>
            Irminsul is a comprehensive analytics and tool platform inspired by the World Tree of Teyvat.
            It provides players with in-depth statistics, team compositions, and simulation tools.
          </p>
        </section>

        <section className="about-section">
          <h2>Features</h2>
          <ul>
            <li>📊 Spiral Abyss and Stygian Onslaught statistics</li>
            <li>👥 Team composition analysis</li>
            <li>📈 Pick rate tracking and tier rankings</li>
            <li>🔍 Player profile search</li>
            <li>⚙️ Damage calculation simulator</li>
            <li>📚 Complete character, weapon, and artifact database</li>
          </ul>
        </section>

        <section className="about-section">
          <h2>Credits</h2>
          <p>Built with ❤️ for the Genshin Impact community.</p>
          <p>Data sourced from official game databases and community contributions.</p>
        </section>

        <section className="about-section">
          <h2>Privacy</h2>
          <p>Irminsul does not collect personal data. All player profile data is public information.</p>
        </section>
      </div>
    </>
  );
}
