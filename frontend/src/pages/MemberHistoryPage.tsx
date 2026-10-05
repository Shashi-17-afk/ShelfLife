import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  History,
  User,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Loader2,
  AlertCircle,
  ArrowRightLeft,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { DataTable, Column } from '../components/DataTable';
import { BorrowRecord, MemberHistoryData, Member, Book } from '../types';
import { getMemberHistory, getMembers } from '../api/members';
import { returnBook } from '../api/borrow';
import styles from './MemberHistoryPage.module.css';

export const MemberHistoryPage: React.FC = () => {
  const { memberId: routeMemberId } = useParams<{ memberId: string }>();
  const navigate = useNavigate();

  // All members list for selector dropdown
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [activeMemberId, setActiveMemberId] = useState<string>(routeMemberId || '');

  // History dataset
  const [historyData, setHistoryData] = useState<MemberHistoryData | null>(null);

  // UX states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [returningRecordId, setReturningRecordId] = useState<string | null>(null);

  // 1. Fetch available members for switcher
  useEffect(() => {
    const fetchAllMembers = async () => {
      try {
        const membersList = await getMembers();
        setAllMembers(membersList);

        // If no memberId in URL, default to the first available member
        if (!routeMemberId && membersList.length > 0) {
          setActiveMemberId(membersList[0]._id);
          navigate(`/members/${membersList[0]._id}/history`, { replace: true });
        }
      } catch {
        // Silently continue
      }
    };
    fetchAllMembers();
  }, [routeMemberId, navigate]);

  // Keep activeMemberId in sync when route param changes
  useEffect(() => {
    if (routeMemberId) {
      setActiveMemberId(routeMemberId);
    }
  }, [routeMemberId]);

  // 2. Fetch history for active member
  const loadHistory = useCallback(async (mId: string) => {
    if (!mId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await getMemberHistory(mId);
      setHistoryData(data);
    } catch (err: unknown) {
      interface ErrorResponse {
        response?: { data?: { message?: string } };
        message?: string;
      }
      const e = err as ErrorResponse;
      const msg = e.response?.data?.message || e.message || 'Failed to load member borrowing history.';
      setError(msg);
      setHistoryData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeMemberId) {
      loadHistory(activeMemberId);
    }
  }, [activeMemberId, loadHistory]);

  // 3. Handle member dropdown switch
  const handleMemberChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    if (newId) {
      setActiveMemberId(newId);
      navigate(`/members/${newId}/history`);
    }
  };

  // 4. Return Book Action
  const handleReturnBook = async (recordId: string, bookTitle: string) => {
    try {
      setReturningRecordId(recordId);
      const res = await returnBook(recordId);

      toast.success(`'${bookTitle}' has been successfully returned!`);

      const returnedRecord = res.data?.record;
      if (returnedRecord) {
        const returnTimestamp = returnedRecord.returnDate || new Date().toISOString();
        setHistoryData((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            history: prev.history.map((rec) =>
              rec._id === recordId
                ? {
                    ...rec,
                    status: 'returned',
                    returnDate: returnTimestamp,
                  }
                : rec
            ),
          };
        });
      }
    } catch (err: unknown) {
      interface ErrorResponse {
        response?: { data?: { message?: string } };
        message?: string;
      }
      const e = err as ErrorResponse;
      toast.error(e.response?.data?.message || 'Failed to return book.');
    } finally {
      setReturningRecordId(null);
    }
  };

  // 5. Aggregate History Stats
  const stats = useMemo(() => {
    if (!historyData) return { total: 0, active: 0, overdue: 0, returned: 0 };
    const records = historyData.history;
    const now = new Date();

    let active = 0;
    let overdue = 0;
    let returned = 0;

    records.forEach((r) => {
      if (r.returnDate || r.status === 'returned') {
        returned++;
      } else if (new Date(r.dueDate) < now || r.status === 'overdue') {
        overdue++;
      } else {
        active++;
      }
    });

    return {
      total: records.length,
      active,
      overdue,
      returned,
    };
  }, [historyData]);

  // 6. Generic DataTable Columns
  const columns: Column<BorrowRecord>[] = useMemo(
    () => [
      {
        key: 'book',
        header: 'Book Title & Author',
        render: (record) => {
          const bookObj = typeof record.book === 'object' ? (record.book as Book) : null;
          return (
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                {bookObj?.title || 'Unknown Title'}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {bookObj?.author ? `by ${bookObj.author}` : ''} {bookObj?.ISBN ? `(ISBN: ${bookObj.ISBN})` : ''}
              </div>
            </div>
          );
        },
      },
      {
        key: 'issueDate',
        header: 'Issue Date',
        render: (record) => (
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {new Date(record.issueDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        ),
      },
      {
        key: 'dueDate',
        header: 'Due Date',
        render: (record) => (
          <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>
            {new Date(record.dueDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        ),
      },
      {
        key: 'returnDate',
        header: 'Return Date',
        render: (record) => (
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {record.returnDate
              ? new Date(record.returnDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : '—'}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (record) => {
          const isReturned = !!record.returnDate || record.status === 'returned';
          const isOverdue = !isReturned && (new Date(record.dueDate) < new Date() || record.status === 'overdue');

          if (isReturned) {
            return (
              <span className="badge badge-returned">
                <CheckCircle2 size={13} />
                <span>RETURNED</span>
              </span>
            );
          }

          if (isOverdue) {
            return (
              <span className="badge badge-overdue">
                <AlertTriangle size={13} />
                <span>OVERDUE</span>
              </span>
            );
          }

          return (
            <span className="badge badge-issued">
              <Clock size={13} />
              <span>ISSUED</span>
            </span>
          );
        },
      },
      {
        key: 'actions',
        header: 'Action',
        align: 'right',
        render: (record) => {
          const isReturned = !!record.returnDate || record.status === 'returned';
          const bookObj = typeof record.book === 'object' ? (record.book as Book) : null;
          const bookTitle = bookObj?.title || 'Book';

          if (isReturned) {
            return <span className={styles.completedLabel}>Completed</span>;
          }

          const isCurrentActionInFlight = returningRecordId === record._id;

          return (
            <button
              onClick={() => handleReturnBook(record._id, bookTitle)}
              disabled={isCurrentActionInFlight}
              className={styles.returnBtn}
              title="Process book return & restore inventory"
            >
              {isCurrentActionInFlight ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Returning...</span>
                </>
              ) : (
                <>
                  <RotateCcw size={14} />
                  <span>Return Book</span>
                </>
              )}
            </button>
          );
        },
      },
    ],
    [returningRecordId]
  );

  return (
    <div className={styles.container}>
      {/* Header & Member Switcher */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h1>Member Borrowing History</h1>
          <p>Inspect active loans, returns, and overdue borrowings for campus members.</p>
        </div>

        <div className={styles.memberSwitcher}>
          <Users size={18} style={{ color: 'var(--text-muted)' }} />
          <select
            value={activeMemberId}
            onChange={handleMemberChange}
            className={styles.memberSelect}
          >
            <option value="">-- Choose Member --</option>
            {allMembers.map((m) => (
              <option key={m._id} value={m._id}>
                {m.name} ({m.membershipId})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className={styles.stateCard}>
          <Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary)' }} />
          <p>Loading member borrowing history...</p>
        </div>
      ) : error ? (
        <div className={styles.stateCard}>
          <AlertCircle size={36} style={{ color: 'var(--status-danger)' }} />
          <p style={{ color: '#fca5a5' }}>{error}</p>
          <button onClick={() => loadHistory(activeMemberId)} className={styles.retryBtn}>
            Try Again
          </button>
        </div>
      ) : historyData ? (
        <>
          {/* Member Profile & Counters Card */}
          <div className={styles.profileCard}>
            <div className={styles.profileInfo}>
              <div className={styles.profileAvatar}>
                {historyData.member.name.charAt(0).toUpperCase()}
              </div>
              <div className={styles.profileDetails}>
                <h2>{historyData.member.name}</h2>
                <div className={styles.profileMeta}>
                  <span className={styles.profileMetaItem}>
                    Membership ID: <strong>{historyData.member.membershipId}</strong>
                  </span>
                  <span className={styles.profileMetaItem}>
                    Email: <strong>{historyData.member.email}</strong>
                  </span>
                  <span className={styles.profileMetaItem}>
                    Joined: <strong>{new Date(historyData.member.joinedDate).toLocaleDateString()}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Stats Pill Counters */}
            <div className={styles.statsRow}>
              <div className={styles.statPill}>
                <span className={styles.statNumber}>{stats.total}</span>
                <span className={styles.statLabel}>Total Loans</span>
              </div>
              <div className={styles.statPill}>
                <span className={styles.statNumber} style={{ color: 'var(--primary)' }}>
                  {stats.active}
                </span>
                <span className={styles.statLabel}>Active</span>
              </div>
              <div className={styles.statPill}>
                <span className={styles.statNumber} style={{ color: 'var(--status-danger)' }}>
                  {stats.overdue}
                </span>
                <span className={styles.statLabel}>Overdue</span>
              </div>
              <div className={styles.statPill}>
                <span className={styles.statNumber} style={{ color: 'var(--status-success)' }}>
                  {stats.returned}
                </span>
                <span className={styles.statLabel}>Returned</span>
              </div>
            </div>
          </div>

          {/* Borrow Records Table */}
          {historyData.history.length === 0 ? (
            <div className={styles.stateCard}>
              <History size={40} style={{ color: 'var(--text-subtle)' }} />
              <p>This member does not have any borrowing history yet.</p>
              <Link to="/issue" className={styles.emptyIssueLink}>
                <ArrowRightLeft size={16} />
                <span>Issue a Book to This Member</span>
              </Link>
            </div>
          ) : (
            <DataTable<BorrowRecord>
              data={historyData.history}
              columns={columns}
              keyExtractor={(item) => item._id}
              emptyMessage="No borrow records found."
            />
          )}
        </>
      ) : (
        <div className={styles.stateCard}>
          <User size={36} style={{ color: 'var(--text-subtle)' }} />
          <p>Please select a member from the dropdown above to view their borrowing history.</p>
        </div>
      )}
    </div>
  );
};

export default MemberHistoryPage;
