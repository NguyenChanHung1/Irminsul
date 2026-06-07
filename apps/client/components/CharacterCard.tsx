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
          {character.element_icon_url && (
            <Image
              src={character.element_icon_url}
              alt={`${character.element} vision`}
              width={30}
              height={30}
              className="vision-corner-icon"
            />
          )}
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
        <p className="weapon-type">
          {character.weapon_type_icon_url && (
            <Image
              src={character.weapon_type_icon_url}
              alt=""
              width={16}
              height={16}
              className="meta-icon"
            />
          )}
          {character.weapon_type}
        </p>
        {character.title && <p className="character-title">{character.title}</p>}
        <p className="region">{character.affiliation || character.region}</p>
      </div>
    </div>
  );

  return showLink ? (
    <Link href={`/characters/${character.id}`}>{card}</Link>
  ) : (
    card
  );
}
