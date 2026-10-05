import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ArrowRightLeft,
  UserCheck,
  BookOpen,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Loader2,
  X,
  History,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Book, Member, BorrowRecord } from '../types';
import { getBooks } from '../api/books';
import { getMembers, createMember } from '../api/members';
import { issueBook } from '../api/borrow';
import styles from './IssuePage.module.css';

export const IssuePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Data sources
  const [books, setBooks] = useState<Book[]>([]);
  const [members, setMembers] = useState<Member[]>([]);

  // Selection states
  const [selectedBookId, setSelectedBookId] = useState<string>('');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');

  // UX states
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [lastIssuedRecord, setLastIssuedRecord] = useState<BorrowRecord | null>(null);

  // New Member Modal state
  const [isMemberModalOpen, setIsMemberModalOpen] = useState<boolean>(false);
  const [isSubmittingMember, setIsSubmittingMember] = useState<boolean>(false);
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    membershipId: '',
  });

  // Load initial dropdown datasets
  const loadData = useCallback(async () => {
    try {
      setIsLoadingData(true);
      const [booksRes, membersRes] = await Promise.all([
        getBooks({ limit: 100 }),
        getMembers(),
      ]);

      setBooks(booksRes.data);
      setMembers(membersRes);

      // If URL has ?bookId=..., auto-select it if found
      const paramBookId = searchParams.get('bookId');
      if (paramBookId) {
        setSelectedBookId(paramBookId);
      }
    } catch {
      toast.error('Failed to load books or members list.');
    } finally {
      setIsLoadingData(false);
    }
  }, [searchParams]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derived selected entities
  const selectedBook = useMemo(
    () => books.find((b) => b._id === selectedBookId),
    [books, selectedBookId]
  );

  const selectedMember = useMemo(
    () => members.find((m) => m._id === selectedMemberId),
    [members, selectedMemberId]
  );

  const isBookUnavailable = selectedBook ? selectedBook.availableCopies <= 0 : false;

  // Issue Book Submission Handler
  const handleIssueBook = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedMemberId) {
      toast.error('Please select a member.');
      return;
    }
    if (!selectedBookId) {
      toast.error('Please select a book.');
      return;
    }
    if (isBookUnavailable) {
      toast.error('This book is currently out of stock and cannot be issued.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await issueBook({
        bookId: selectedBookId,
        memberId: selectedMemberId,
      });

      if (res.data) {
        setLastIssuedRecord(res.data);
        toast.success(`Book '${selectedBook?.title}' successfully issued!`);

        // Update local availableCopies state for instant UI responsiveness
        setBooks((prevBooks) =>
          prevBooks.map((b) =>
            b._id === selectedBookId
              ? { ...b, availableCopies: Math.max(0, b.availableCopies - 1) }
              : b
          )
        );

        // Reset selections
        setSelectedBookId('');
      }
    } catch (err: unknown) {
      interface ErrorResponse {
        response?: { data?: { message?: string } };
        message?: string;
      }
      const e = err as ErrorResponse;
      const msg = e.response?.data?.message || e.message || 'Failed to issue book.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Member Registration Handler
  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.name.trim() || !newMember.email.trim() || !newMember.membershipId.trim()) {
      toast.error('All member fields are required.');
      return;
    }

    try {
      setIsSubmittingMember(true);
      const res = await createMember({
        name: newMember.name.trim(),
        email: newMember.email.trim().toLowerCase(),
        membershipId: newMember.membershipId.trim(),
      });

      if (res.data) {
        toast.success(`Member '${res.data.name}' registered!`);
        setMembers((prev) => [...prev, res.data!]);
        setSelectedMemberId(res.data._id);
        setIsMemberModalOpen(false);
        setNewMember({ name: '', email: '', membershipId: '' });
      }
    } catch (err: unknown) {
      interface ErrorResponse {
        response?: { data?: { message?: string } };
        message?: string;
      }
      const e = err as ErrorResponse;
      toast.error(e.response?.data?.message || 'Failed to register member.');
    } finally {
      setIsSubmittingMember(false);
    }
  };

  // Due date estimation (14 days from today)
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const dueDateEstimate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1>Issue Library Book</h1>
        <p>Assign catalog items to registered campus library members.</p>
      </div>

      {/* Success Notification Banner from previous issue */}
      {lastIssuedRecord && (
        <div className={styles.successCard}>
          <div className={styles.successHeader}>
            <CheckCircle2 size={20} />
            <span>Book Issued Successfully</span>
          </div>
          <div className={styles.successDetails}>
            Record ID: <code>{lastIssuedRecord._id}</code>
            <br />
            Due Date: <strong>{new Date(lastIssuedRecord.dueDate).toLocaleDateString()}</strong> (Default 14-day borrowing window).
          </div>
          <button
            onClick={() => {
              const mId = typeof lastIssuedRecord.member === 'string'
                ? lastIssuedRecord.member
                : lastIssuedRecord.member._id;
              navigate(`/members/${mId}/history`);
            }}
            className={styles.viewHistoryBtn}
          >
            <History size={16} />
            <span>View Member's Borrowing History</span>
          </button>
        </div>
      )}

      {/* Main Issue Form Card */}
      <div className={styles.card}>
        {isLoadingData ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary)', margin: '0 auto 1rem' }} />
            <p>Loading members and books...</p>
          </div>
        ) : (
          <form onSubmit={handleIssueBook} className={styles.form}>
            {/* Member Selector */}
            <div className={styles.fieldGroup}>
              <div className={styles.labelRow}>
                <label htmlFor="memberSelect" className={styles.label}>
                  1. Select Member *
                </label>
                <button
                  type="button"
                  onClick={() => setIsMemberModalOpen(true)}
                  className={styles.quickAddBtn}
                >
                  <Plus size={14} />
                  <span>Register New Member</span>
                </button>
              </div>

              <select
                id="memberSelect"
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className={styles.select}
                required
              >
                <option value="">-- Choose a registered member --</option>
                {members.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name} ({m.membershipId} — {m.email})
                  </option>
                ))}
              </select>

              {/* Selected Member Preview */}
              {selectedMember && (
                <div className={styles.previewBox}>
                  <div className={styles.previewTitle}>
                    <UserCheck size={16} style={{ color: 'var(--status-success)', display: 'inline', marginRight: '6px' }} />
                    {selectedMember.name}
                  </div>
                  <div className={styles.previewMeta}>
                    <span className={styles.metaItem}>
                      ID: <strong>{selectedMember.membershipId}</strong>
                    </span>
                    <span className={styles.metaItem}>
                      Email: <strong>{selectedMember.email}</strong>
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Book Selector */}
            <div className={styles.fieldGroup}>
              <div className={styles.labelRow}>
                <label htmlFor="bookSelect" className={styles.label}>
                  2. Select Book *
                </label>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Total catalog items: {books.length}
                </span>
              </div>

              <select
                id="bookSelect"
                value={selectedBookId}
                onChange={(e) => setSelectedBookId(e.target.value)}
                className={styles.select}
                required
              >
                <option value="">-- Choose a book from the catalog --</option>
                {books.map((b) => (
                  <option
                    key={b._id}
                    value={b._id}
                    disabled={b.availableCopies <= 0}
                  >
                    {b.title} — by {b.author} [{b.availableCopies > 0 ? `${b.availableCopies} available` : 'OUT OF STOCK'}]
                  </option>
                ))}
              </select>

              {/* Selected Book Preview */}
              {selectedBook && (
                <div className={styles.previewBox}>
                  <div className={styles.previewTitle}>
                    <BookOpen size={16} style={{ color: 'var(--primary)', display: 'inline', marginRight: '6px' }} />
                    {selectedBook.title}
                  </div>
                  <div className={styles.previewMeta}>
                    <span className={styles.metaItem}>
                      Author: <strong>{selectedBook.author}</strong>
                    </span>
                    <span className={styles.metaItem}>
                      ISBN: <strong>{selectedBook.ISBN}</strong>
                    </span>
                    <span className={styles.metaItem}>
                      Genre: <strong>{selectedBook.genre}</strong>
                    </span>
                    <span className={styles.metaItem}>
                      Available: <strong>{selectedBook.availableCopies} / {selectedBook.totalCopies}</strong>
                    </span>
                  </div>
                </div>
              )}

              {/* Stock Warning if unavailable */}
              {isBookUnavailable && (
                <div className={styles.warningAlert}>
                  <AlertTriangle size={20} />
                  <span>
                    <strong>Cannot Issue:</strong> Zero copies are currently available in inventory.
                  </span>
                </div>
              )}
            </div>

            {/* 14-Day Borrowing Period Policy */}
            <div className={styles.policyBanner}>
              <Calendar size={20} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>ShelfLife Borrowing Policy:</strong>
                <div>Loans are automatically assigned a default duration of <strong>14 calendar days</strong>.</div>
                <div className={styles.policyDates}>
                  <span>Issue Date: <strong>{todayFormatted}</strong></span>
                  <span>Estimated Due Date: <strong>{dueDateEstimate}</strong></span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className={styles.actionsRow}>
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={
                  isSubmitting ||
                  !selectedMemberId ||
                  !selectedBookId ||
                  isBookUnavailable
                }
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Processing Atomic Issue...</span>
                  </>
                ) : (
                  <>
                    <ArrowRightLeft size={18} />
                    <span>Confirm & Issue Book</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedBookId('');
                  setSelectedMemberId('');
                }}
                className={styles.resetBtn}
                disabled={isSubmitting}
              >
                Reset
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Modal Dialog: Quick Member Registration */}
      {isMemberModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalDialog}>
            <div className={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserCheck size={20} style={{ color: 'var(--primary)' }} />
                <h2>Register New Library Member</h2>
              </div>
              <button
                onClick={() => setIsMemberModalOpen(false)}
                className={styles.closeBtn}
                disabled={isSubmittingMember}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateMember} className={styles.modalForm}>
              <div className={styles.formField}>
                <label>Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alice Henderson"
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  disabled={isSubmittingMember}
                  autoFocus
                />
              </div>

              <div className={styles.formField}>
                <label>Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. alice@campus.edu"
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  disabled={isSubmittingMember}
                />
              </div>

              <div className={styles.formField}>
                <label>Membership ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MEM-2026-042"
                  value={newMember.membershipId}
                  onChange={(e) => setNewMember({ ...newMember, membershipId: e.target.value })}
                  disabled={isSubmittingMember}
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setIsMemberModalOpen(false)}
                  className={styles.resetBtn}
                  disabled={isSubmittingMember}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={isSubmittingMember}
                  style={{ flex: 'none', padding: '0.65rem 1.25rem' }}
                >
                  {isSubmittingMember ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Saving Member...</span>
                    </>
                  ) : (
                    <span>Register Member</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IssuePage;
