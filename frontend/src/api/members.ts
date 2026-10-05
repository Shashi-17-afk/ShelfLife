import apiClient from './client';
import { Member, ApiResponse, MemberHistoryData } from '../types';

export interface CreateMemberInput {
  name: string;
  email: string;
  membershipId: string;
}

/**
 * Fetch all members for selection dropdowns (Helper endpoint)
 */
export const getMembers = async (search?: string): Promise<Member[]> => {
  const query = search && search.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
  const response = await apiClient.get<ApiResponse<Member[]>>(`/members${query}`);
  return response.data.data || [];
};

/**
 * Register a new library member (Authenticated)
 */
export const createMember = async (input: CreateMemberInput): Promise<ApiResponse<Member>> => {
  const response = await apiClient.post<ApiResponse<Member>>('/members', input);
  return response.data;
};

/**
 * Get borrowing history for a specific member
 */
export const getMemberHistory = async (memberId: string): Promise<MemberHistoryData> => {
  const response = await apiClient.get<ApiResponse<MemberHistoryData>>(`/members/${memberId}/history`);
  if (!response.data.data) {
    throw new Error('Member history data not found');
  }
  return response.data.data;
};
