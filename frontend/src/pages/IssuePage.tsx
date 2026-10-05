import React from 'react';

export const IssuePage: React.FC = () => {
  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Issue a Book</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Assign an available library book to a registered member.
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
          Issue Book Workflow
        </p>
        <p style={{ fontSize: '0.9rem' }}>
          The interactive member/book dropdown selector and atomic borrowing form will be built in Phase 9.
        </p>
      </div>
    </div>
  );
};

export default IssuePage;
