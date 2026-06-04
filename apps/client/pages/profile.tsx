// Player profile page
import Head from "next/head";
import CharacterCard from "../components/CharacterCard";
import ChartContainer from "../components/ChartContainer";
import { PlayerProfile } from "../types";

export default function ProfilePage() {
  // TODO: Fetch current user's profile from context/session or API
  const profile = null as PlayerProfile | null;

  if (!profile) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <p>📭 No profile found</p>
          <p>
            <a href="/search">Search for a player profile</a> or log in to view your profile
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{profile.name} - Profile | Irminsul</title>
      </Head>

      <div className="page-container profile-page">
        {/* Profile Header */}
        <ChartContainer title="Player Information">
          <div className="profile-header">
            <div className="profile-main">
              <h1>{profile.name}</h1>
              <p className="uid">UID: {profile.uid}</p>
            </div>
            <div className="profile-stats">
              <div className="stat">
                <span className="label">Level</span>
                <span className="value">{profile.level}</span>
              </div>
              <div className="stat">
                <span className="label">Adventure Rank</span>
                <span className="value">{profile.adventure_rank}</span>
              </div>
              <div className="stat">
                <span className="label">Characters</span>
                <span className="value">{profile.characters.length}</span>
              </div>
            </div>
          </div>
        </ChartContainer>

        {/* Character Showcase */}
        {profile.showcaseCharacters && profile.showcaseCharacters.length > 0 && (
          <ChartContainer title="Character Showcase">
            <div className="showcase-grid">
              {profile.showcaseCharacters.map((char) => (
                <CharacterCard
                  key={char.id}
                  character={char}
                  showLink={true}
                />
              ))}
            </div>
          </ChartContainer>
        )}

        {/* All Characters */}
        <ChartContainer title="All Owned Characters">
          <div className="characters-grid">
            {profile.characters.map((char) => (
              <CharacterCard
                key={char.id}
                character={char}
                showLink={true}
                compact={true}
              />
            ))}
          </div>
        </ChartContainer>

        {/* Character Statistics */}
        <ChartContainer title="Collection Overview">
          <div className="collection-stats">
            <div className="stat-group">
              <h4>By Rarity</h4>
              <div className="stats">
                <p>5⭐: — characters</p>
                <p>4⭐: — characters</p>
              </div>
            </div>
            <div className="stat-group">
              <h4>By Element</h4>
              <div className="stats">
                <p>Pyro: — | Hydro: — | Electro: —</p>
                <p>Cryo: — | Anemo: — | Geo: —</p>
                <p>Dendro: —</p>
              </div>
            </div>
          </div>
        </ChartContainer>
      </div>
    </>
  );
}
