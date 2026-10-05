import React from 'react';
import { useParams } from 'react-router-dom';

export const MemberHistoryPage: React.FC = () => {
  const { memberId } = useParams<{ memberId: string }>();

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Member Borrowing History</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Viewing records for Member ID: {memberId || 'Unknown'}
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
          Member Borrowing History View
        </p>
        <p style={{ fontSize: '0.9rem' }}>
          The complete member history table, status badges, and overdue calculations will be implemented in Phase 10.
        </p>
      </div>
    </div>
  );
};

export default MemberHistoryPage;
