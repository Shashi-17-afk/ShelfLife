import React from 'react';

export const BooksPage: React.FC = () => {
  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Library Books Catalogue</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Browse, search, and manage books available in ShelfLife.
        </p>
      </div>

      <div
        style={{
          background: 'var(--bg-surface)',
          padding: '2rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-default)',
          textAlign: 'center',
          color: 'var(--text-muted)',
        }}
      >
        <p style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
          Phase 7 Authentication & Layout Verified
        </p>
        <p style={{ fontSize: '0.9rem' }}>
          The Book Catalogue with DataTable, search, genre filter, and pagination will be fully connected in Phase 8.
        </p>
      </div>
    </div>
  );
};

export default BooksPage;
