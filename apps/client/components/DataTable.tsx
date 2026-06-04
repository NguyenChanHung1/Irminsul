// Reusable data table component
import { ReactNode } from "react";

export interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (value: any, row: T) => ReactNode;
  sortable?: boolean;
  width?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyMessage?: string;
}

export default function DataTable<T>({
  data,
  columns,
  onRowClick,
  loading,
  emptyMessage = "No data available",
}: DataTableProps<T>) {
  if (loading) {
    return <div className="data-table loading">Loading...</div>;
  }

  if (data.length === 0) {
    return <div className="data-table empty">{emptyMessage}</div>;
  }

  return (
    <div className="data-table-container">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                style={{ width: col.width }}
                className={col.sortable ? "sortable" : ""}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              className={onRowClick ? "clickable" : ""}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col) => (
                <td key={`${rowIdx}-${String(col.key)}`}>
                  {col.render
                    ? col.render((row as any)[col.key as keyof T], row)
                    : String((row as any)[col.key as keyof T])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
