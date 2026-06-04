// UID Search page
import { useState } from "react";
import Head from "next/head";
import SearchInput from "../components/SearchInput";
import ChartContainer from "../components/ChartContainer";
import { PlayerProfile } from "../types";

export default function SearchPage() {
  const [uid, setUid] = useState("");
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setProfile(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // TODO: Call API to fetch player profile by UID
      // const response = await fetch(`/api/players/${query}`);
      // const data = await response.json();
      // setProfile(data);
      console.log("Searching for UID:", query);
    } catch (err) {
      setError("Failed to fetch profile. Please check the UID and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>UID Search | Irminsul</title>
      </Head>

      <div className="page-container">
        <div className="page-header">
          <h1>🔍 UID Search</h1>
          <p>Look up player profiles and view their character showcase</p>
        </div>

        <SearchInput
          placeholder="Enter player UID (e.g., 123456789)"
          onSearch={handleSearch}
        />

        {error && <div className="error-message">{error}</div>}

        {loading && <div className="loading-state">Fetching profile...</div>}

        {profile && (
          <div className="profile-results">
            <ChartContainer title="Player Profile">
              <div className="profile-summary">
                <div className="profile-info">
                  <h2>{profile.name}</h2>
                  <p>UID: {profile.uid}</p>
                  <p>Level: {profile.level}</p>
                  <p>Adventure Rank: {profile.adventure_rank}</p>
                </div>
                <div className="character-count">
                  <p>{profile.characters.length} Characters Owned</p>
                </div>
              </div>
            </ChartContainer>

            {profile.showcaseCharacters && profile.showcaseCharacters.length > 0 && (
              <ChartContainer title="Character Showcase">
                <div className="showcase-grid">
                  {profile.showcaseCharacters.map((char) => (
                    <div key={char.id} className="showcase-item">
                      <h4>{char.name}</h4>
                      <p>{char.element}</p>
                      <p className="level">Lv. —</p>
                    </div>
                  ))}
                </div>
              </ChartContainer>
            )}

            <ChartContainer title="All Characters">
              <div className="all-characters-grid">
                {profile.characters.map((char) => (
                  <div key={char.id} className="char-item">
                    <p>{char.name}</p>
                    <p className="element">{char.element}</p>
                  </div>
                ))}
              </div>
            </ChartContainer>
          </div>
        )}

        {!profile && !loading && !error && (
          <div className="empty-state">
            <p>🔎 Enter a UID to search for player profiles</p>
          </div>
        )}
      </div>
    </>
  );
}
