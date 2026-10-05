import React from 'react';
import styles from './DataTable.module.css';

export interface Column<T> {
  key: string;
  header: string;
  render: (item: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
}

/**
 * Reusable Generic TypeScript DataTable component.
 * Used across the application for Book Catalogue and Member Borrowing History.
 */
export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  emptyMessage = 'No records found.',
}: DataTableProps<T>): React.ReactElement {
  if (data.length === 0) {
    return (
      <div className={styles.tableContainer}>
        <div className={styles.emptyState}>{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={styles.th}
                style={{
                  width: col.width,
                  textAlign: col.align || 'left',
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={keyExtractor(item)} className={styles.tr}>
              {columns.map((col) => (
                <td
                  key={`${keyExtractor(item)}-${col.key}`}
                  className={styles.td}
                  style={{ textAlign: col.align || 'left' }}
                >
                  {col.render(item)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
