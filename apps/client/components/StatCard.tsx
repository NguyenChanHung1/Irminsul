// Reusable component for displaying statistical cards
import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  suffix?: string;
  icon?: string;
  trend?: { direction: "up" | "down"; percentage: number };
  onClick?: () => void;
}

export default function StatCard({
  title,
  value,
  suffix,
  icon,
  trend,
  onClick,
}: StatCardProps) {
  return (
    <div className="stat-card" onClick={onClick}>
      {icon && <span className="stat-icon">{icon}</span>}
      <h4>{title}</h4>
      <div className="stat-value">
        {value}
        {suffix && <span className="stat-suffix">{suffix}</span>}
      </div>
      {trend && (
        <div className={`stat-trend ${trend.direction}`}>
          {trend.direction === "up" ? "↗" : "↘"} {trend.percentage}%
        </div>
      )}
    </div>
  );
}
