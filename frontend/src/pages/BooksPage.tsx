import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  BookOpen,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  ArrowRightLeft,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { DataTable, Column } from '../components/DataTable';
import { Book, PaginationMetadata } from '../types';
import { getBooks, createBook, CreateBookInput } from '../api/books';
import styles from './BooksPage.module.css';

const GENRE_OPTIONS = [
  'All',
  'Fiction',
  'Non-Fiction',
  'Technology',
  'Science',
  'History',
  'Fantasy',
  'Biography',
  'Classic',
  'Other',
];

export const BooksPage: React.FC = () => {
  const navigate = useNavigate();

  // Data states
  const [books, setBooks] = useState<Book[]>([]);
  const [pagination, setPagination] = useState<PaginationMetadata>({
    page: 1,
    limit: 8,
    total: 0,
    pages: 1,
  });

  // Filter states
  const [page, setPage] = useState<number>(1);
  const [genre, setGenre] = useState<string>('All');
  const [searchInput, setSearchInput] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');

  // UX states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Add Book Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSubmittingBook, setIsSubmittingBook] = useState<boolean>(false);
  const [newBook, setNewBook] = useState<CreateBookInput>({
    title: '',
    author: '',
    ISBN: '',
    genre: 'Fiction',
    totalCopies: 5,
    availableCopies: 5,
  });

  // Debounce search input by 350ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1); // Reset to page 1 on new search
    }, 350);

    return () => clearTimeout(handler);
  }, [searchInput]);

  // Reset to page 1 on genre change
  const handleGenreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setGenre(e.target.value);
    setPage(1);
  };

  // Fetch Books from backend
  const loadBooks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const res = await getBooks({
        page,
        limit: 8,
        genre: genre !== 'All' ? genre : undefined,
        search: debouncedSearch || undefined,
      });

      setBooks(res.data);
      setPagination(res.pagination);
    } catch (err: unknown) {
      interface ErrorResponse {
        response?: { data?: { message?: string } };
        message?: string;
      }
      const e = err as ErrorResponse;
      const msg = e.response?.data?.message || e.message || 'Failed to fetch book catalogue.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [page, genre, debouncedSearch]);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  // Handle Add Book Submission
  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newBook.title.trim() || !newBook.author.trim() || !newBook.ISBN.trim()) {
      toast.error('Please fill in title, author, and ISBN.');
      return;
    }
    if (newBook.totalCopies <= 0) {
      toast.error('Total copies must be at least 1.');
      return;
    }

    try {
      setIsSubmittingBook(true);
      await createBook({
        ...newBook,
        title: newBook.title.trim(),
        author: newBook.author.trim(),
        ISBN: newBook.ISBN.trim(),
        availableCopies: newBook.totalCopies,
      });

      toast.success(`'${newBook.title}' added to catalog!`);
      setIsModalOpen(false);
      setNewBook({
        title: '',
        author: '',
        ISBN: '',
        genre: 'Fiction',
        totalCopies: 5,
        availableCopies: 5,
      });
      // Refresh list
      loadBooks();
    } catch (err: unknown) {
      interface ErrorResponse {
        response?: { data?: { message?: string } };
        message?: string;
      }
      const e = err as ErrorResponse;
      toast.error(e.response?.data?.message || 'Failed to create book.');
    } finally {
      setIsSubmittingBook(false);
    }
  };

  // Define Typed DataTable Columns
  const columns: Column<Book>[] = useMemo(
    () => [
      {
        key: 'title',
        header: 'Title & Author',
        render: (book) => (
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{book.title}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>by {book.author}</div>
          </div>
        ),
      },
      {
        key: 'isbn',
        header: 'ISBN',
        render: (book) => (
          <code style={{ fontSize: '0.82rem', color: 'var(--text-subtle)' }}>{book.ISBN}</code>
        ),
      },
      {
        key: 'genre',
        header: 'Genre',
        render: (book) => <span className={styles.genreTag}>{book.genre}</span>,
      },
      {
        key: 'totalCopies',
        header: 'Total',
        align: 'center',
        render: (book) => <span>{book.totalCopies}</span>,
      },
      {
        key: 'availability',
        header: 'Availability',
        render: (book) => {
          const isAvailable = book.availableCopies > 0;
          return isAvailable ? (
            <span className={styles.inStock}>
              <span className={styles.stockDot} />
              <span>{book.availableCopies} Available</span>
            </span>
          ) : (
            <span className={styles.outOfStock}>
              <span className={styles.stockDot} />
              <span>0 Available (Out of Stock)</span>
            </span>
          );
        },
      },
      {
        key: 'actions',
        header: 'Action',
        align: 'right',
        render: (book) => (
          <button
            onClick={() => navigate(`/issue?bookId=${book._id}`)}
            disabled={book.availableCopies <= 0}
            style={{
              padding: '0.35rem 0.75rem',
              backgroundColor:
                book.availableCopies > 0 ? 'var(--primary-subtle)' : 'var(--bg-surface-elevated)',
              color: book.availableCopies > 0 ? 'var(--primary)' : 'var(--text-subtle)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              cursor: book.availableCopies > 0 ? 'pointer' : 'not-allowed',
              opacity: book.availableCopies > 0 ? 1 : 0.5,
              border: `1px solid ${book.availableCopies > 0 ? 'rgba(59, 130, 246, 0.3)' : 'var(--border-default)'}`,
            }}
            title={book.availableCopies > 0 ? 'Issue this book' : 'No copies available'}
          >
            <ArrowRightLeft size={14} />
            <span>Issue</span>
          </button>
        ),
      },
    ],
    [navigate]
  );

  return (
    <div className={styles.container}>
      {/* Header Area */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h1>Book Catalogue</h1>
          <p>Browse, filter, and monitor library book inventory in real time.</p>
        </div>

        <button onClick={() => setIsModalOpen(true)} className={styles.addBtn}>
          <Plus size={18} />
          <span>Add New Book</span>
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search books by title..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <select value={genre} onChange={handleGenreChange} className={styles.genreSelect}>
          {GENRE_OPTIONS.map((g) => (
            <option key={g} value={g}>
              {g === 'All' ? 'All Genres' : g}
            </option>
          ))}
        </select>
      </div>

      {/* Content Area: Loading / Error / Data */}
      {isLoading ? (
        <div className={styles.stateCard}>
          <Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary)' }} />
          <p style={{ color: 'var(--text-muted)' }}>Loading book catalogue from server...</p>
        </div>
      ) : error ? (
        <div className={styles.stateCard}>
          <AlertCircle size={36} style={{ color: 'var(--status-danger)' }} />
          <p className={styles.errorText}>{error}</p>
          <button onClick={loadBooks} className={styles.retryBtn}>
            Try Again
          </button>
        </div>
      ) : (
        <>
          <DataTable<Book>
            data={books}
            columns={columns}
            keyExtractor={(item) => item._id}
            emptyMessage="No books found matching your current filter criteria."
          />

          {/* Pagination Controls */}
          {pagination.total > 0 && (
            <div className={styles.paginationBar}>
              <div className={styles.pageInfo}>
                Showing <strong>{books.length}</strong> of <strong>{pagination.total}</strong> books
                (Page {pagination.page} of {pagination.pages})
              </div>

              <div className={styles.pageActions}>
                <button
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={pagination.page <= 1}
                  className={styles.pageBtn}
                >
                  <ChevronLeft size={16} />
                  <span>Previous</span>
                </button>

                <button
                  onClick={() => setPage((prev) => Math.min(prev + 1, pagination.pages))}
                  disabled={pagination.page >= pagination.pages}
                  className={styles.pageBtn}
                >
                  <span>Next</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add New Book Modal Dialog */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalDialog}>
            <div className={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={20} style={{ color: 'var(--primary)' }} />
                <h2>Add Book to Catalog</h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className={styles.closeBtn}
                disabled={isSubmittingBook}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateBook} className={styles.modalForm}>
              <div className={styles.formField}>
                <label>Book Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Clean Architecture"
                  value={newBook.title}
                  onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                  disabled={isSubmittingBook}
                  autoFocus
                />
              </div>

              <div className={styles.formField}>
                <label>Author *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Robert C. Martin"
                  value={newBook.author}
                  onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                  disabled={isSubmittingBook}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formField}>
                  <label>ISBN *</label>
                  <input
                    type="text"
                    required
                    placeholder="9780134494166"
                    value={newBook.ISBN}
                    onChange={(e) => setNewBook({ ...newBook, ISBN: e.target.value })}
                    disabled={isSubmittingBook}
                  />
                </div>

                <div className={styles.formField}>
                  <label>Genre</label>
                  <select
                    value={newBook.genre}
                    onChange={(e) => setNewBook({ ...newBook, genre: e.target.value })}
                    disabled={isSubmittingBook}
                  >
                    {GENRE_OPTIONS.filter((g) => g !== 'All').map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.formField}>
                <label>Total Copies *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={newBook.totalCopies}
                  onChange={(e) =>
                    setNewBook({ ...newBook, totalCopies: parseInt(e.target.value, 10) || 1 })
                  }
                  disabled={isSubmittingBook}
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={styles.cancelBtn}
                  disabled={isSubmittingBook}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitModalBtn}
                  disabled={isSubmittingBook}
                >
                  {isSubmittingBook ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Saving Book...</span>
                    </>
                  ) : (
                    <span>Add Book</span>
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

export default BooksPage;
