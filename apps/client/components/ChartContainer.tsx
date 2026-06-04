// Reusable chart container for analytics
import { ReactNode } from "react";

interface ChartContainerProps {
  title: string;
  description?: string;
  children: ReactNode;
  footerNote?: string;
}

export default function ChartContainer({
  title,
  description,
  children,
  footerNote,
}: ChartContainerProps) {
  return (
    <div className="chart-container">
      <div className="chart-header">
        <h3>{title}</h3>
        {description && <p className="chart-description">{description}</p>}
      </div>
      <div className="chart-body">{children}</div>
      {footerNote && <div className="chart-footer">{footerNote}</div>}
    </div>
  );
}
