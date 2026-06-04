// Tier badge component for rankings
type TierLevel = "S+" | "S" | "A" | "B" | "C" | "D";

interface TierBadgeProps {
  tier: TierLevel;
  size?: "small" | "medium" | "large";
}

export default function TierBadge({ tier, size = "medium" }: TierBadgeProps) {
  const tierColors: Record<TierLevel, string> = {
    "S+": "tier-s-plus",
    S: "tier-s",
    A: "tier-a",
    B: "tier-b",
    C: "tier-c",
    D: "tier-d",
  };

  return (
    <span className={`tier-badge ${tierColors[tier]} ${size}`}>
      {tier}
    </span>
  );
}
