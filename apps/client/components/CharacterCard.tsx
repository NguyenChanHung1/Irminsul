// Reusable component for character cards (listings, showcase)
import Image from "next/image";
import Link from "next/link";
import { Character } from "../types";

interface CharacterCardProps {
  character: Character;
  showLink?: boolean;
  compact?: boolean;
}

export default function CharacterCard({
  character,
  showLink = true,
  compact = false,
}: CharacterCardProps) {
  const card = (
    <div className={`character-card ${compact ? "compact" : ""}`}>
      {character.image_url && (
        <div className="character-image">
          <Image
            src={character.image_url}
            alt={character.name}
            width={200}
            height={240}
            priority
          />
        </div>
      )}
      <div className="character-info">
        <h3>{character.name}</h3>
        <div className="character-meta">
          <span className={`rarity star-${character.rarity}`}>
            {"⭐".repeat(character.rarity)}
          </span>
          <span className={`element element-${character.element.toLowerCase()}`}>
            {character.element}
          </span>
        </div>
        <p className="weapon-type">{character.weapon_type}</p>
        <p className="region">{character.region}</p>
      </div>
    </div>
  );

  return showLink ? (
    <Link href={`/characters/${character.id}`}>{card}</Link>
  ) : (
    card
  );
}
