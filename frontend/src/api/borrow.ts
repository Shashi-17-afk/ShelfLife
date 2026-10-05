import apiClient from './client';
import { BorrowRecord, ApiResponse } from '../types';

export interface BorrowBookInput {
  bookId: string;
  memberId: string;
}

export interface ReturnBookResponseData {
  record: BorrowRecord;
  availableCopies?: number;
}

/**
 * Atomically issue a book to a member (Authenticated)
 */
export const issueBook = async (input: BorrowBookInput): Promise<ApiResponse<BorrowRecord>> => {
  const response = await apiClient.post<ApiResponse<BorrowRecord>>('/borrow', input);
  return response.data;
};

/**
 * Return a borrowed book and restore availability (Authenticated)
 */
export const returnBook = async (borrowId: string): Promise<ApiResponse<ReturnBookResponseData>> => {
  const response = await apiClient.post<ApiResponse<ReturnBookResponseData>>(`/return/${borrowId}`);
  return response.data;
};
