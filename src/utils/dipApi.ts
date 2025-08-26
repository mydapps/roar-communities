import { createAuthHeaders, validateAuthentication } from '@/utils/apiBase';

export interface DIPStatusResponse {
  success: boolean;
  dip_id: number;
  yes_weight: number;
  no_weight: number;
  total_weight: number;
  yes_pct: number;
  no_pct: number;
  yes_count: number;
  no_count: number;
}

export interface DIPHasVotedResponse {
  success: boolean;
  dip_id: number;
  has_voted: 0 | 1;
  vote?: 'yes' | 'no';
}

export interface DIPVoteResponse {
  success: boolean;
  dip_id: number;
  vote: 'yes' | 'no';
  weight?: number;
  message?: string;
}

export const fetchDIPStatus = async (dipId: number = 1): Promise<DIPStatusResponse | null> => {
  try {
    const res = await fetch(`/api/dip/status?dip_id=${dipId}`, {
      method: 'GET',
      credentials: 'include',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
};

export const fetchDIPHasVoted = async (dipId: number = 1): Promise<DIPHasVotedResponse | null> => {
  try {
    // Only call if authenticated
    const isAuth = await validateAuthentication();
    if (!isAuth) return { success: false as any, dip_id: dipId, has_voted: 0 };
    const res = await fetch(`/api/dip/has_voted?dip_id=${dipId}`, {
      method: 'GET',
      credentials: 'include',
    });
    if (!res.ok) return { success: false as any, dip_id: dipId, has_voted: 0 };
    return await res.json();
  } catch (e) {
    return { success: false as any, dip_id: dipId, has_voted: 0 };
  }
};

export const submitDIPVote = async (dipId: number, vote: 'yes' | 'no'): Promise<DIPVoteResponse> => {
  const res = await fetch('/api/dip/vote', {
    method: 'POST',
    credentials: 'include',
    headers: createAuthHeaders(),
    body: JSON.stringify({ dip_id: dipId, vote }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { success: false as any, dip_id: dipId, vote, message: data?.message || 'Failed to vote' };
  }
  return data as DIPVoteResponse;
};



