// Reusable component for item cards (weapons, artifacts, items)
import Image from "next/image";
import Link from "next/link";

interface ItemCardProps {
  id: string;
  name: string;
  rarity?: number;
  type: string;
  image_url?: string;
  mainStat?: string;
  href?: string;
  onClick?: () => void;
}

export default function ItemCard({
  id,
  name,
  rarity,
  type,
  image_url,
  mainStat,
  href,
  onClick,
}: ItemCardProps) {
  const card = (
    <div className="item-card" onClick={onClick}>
      {image_url && (
        <div className="item-image">
          <Image
            src={image_url}
            alt={name}
            width={120}
            height={120}
            priority
          />
        </div>
      )}
      <div className="item-info">
        <h4>{name}</h4>
        {rarity && <span className={`rarity star-${rarity}`}>{"⭐".repeat(rarity)}</span>}
        <p className="item-type">{type}</p>
        {mainStat && <p className="main-stat">{mainStat}</p>}
      </div>
    </div>
  );

  return href ? <Link href={href}>{card}</Link> : card;
}
