import apiClient from './client';
import { Book, PaginatedResponse, ApiResponse } from '../types';

export interface BookQueryParams {
  page?: number;
  limit?: number;
  genre?: string;
  search?: string;
}

export interface CreateBookInput {
  title: string;
  author: string;
  ISBN: string;
  genre: string;
  totalCopies: number;
  availableCopies?: number;
}

/**
 * Fetch paginated, searchable, and filtered list of books
 */
export const getBooks = async (params: BookQueryParams = {}): Promise<PaginatedResponse<Book>> => {
  const query = new URLSearchParams();

  if (params.page) query.append('page', params.page.toString());
  if (params.limit) query.append('limit', params.limit.toString());
  if (params.genre && params.genre !== 'All') query.append('genre', params.genre);
  if (params.search && params.search.trim()) query.append('search', params.search.trim());

  const response = await apiClient.get<PaginatedResponse<Book>>(`/books?${query.toString()}`);
  return response.data;
};

/**
 * Create a new book in the catalog (Authenticated)
 */
export const createBook = async (input: CreateBookInput): Promise<ApiResponse<Book>> => {
  const response = await apiClient.post<ApiResponse<Book>>('/books', input);
  return response.data;
};
