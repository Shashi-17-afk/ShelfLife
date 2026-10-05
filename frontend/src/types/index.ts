/**
 * ShelfLife LMS - Frontend TypeScript Domain Interfaces
 * Strictly matches backend Mongoose models and API contracts.
 */

export interface Librarian {
  id: string;
  name: string;
  email: string;
}

export interface Book {
  _id: string;
  title: string;
  author: string;
  ISBN: string;
  genre: string;
  totalCopies: number;
  availableCopies: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Member {
  _id: string;
  name: string;
  email: string;
  membershipId: string;
  joinedDate: string;
  createdAt?: string;
  updatedAt?: string;
}

export type BorrowStatus = 'issued' | 'returned' | 'overdue';

export interface BorrowRecord {
  _id: string;
  book: string | Book;
  member: string | Member;
  issueDate: string;
  dueDate: string;
  returnDate: string | null;
  status: BorrowStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationMetadata;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  librarian: Librarian;
}

export interface MemberHistoryData {
  member: {
    id: string;
    name: string;
    email: string;
    membershipId: string;
    joinedDate: string;
  };
  history: BorrowRecord[];
}
