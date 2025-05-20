import { createAuthHeaders } from './apiBase';
// import { PollData } from './postApi'; // Not strictly needed for this function's return type as specified

export interface VoteResponse {
  success: boolean;
  message: string;
  chosen_option_id?: number; // Only present on successful vote
  errCode?: string; // Added for error responses
  community?: string; // Added for error responses, e.g., POLL_COMMUNITY_ACCESS_DENIED
}

/**
 * Cast a vote on a poll option.
 * @param postCode The unique code of the post/poll.
 * @param optionId The ID of the option being voted for.
 * @returns Promise resolving to VoteResponse.
 */
export const voteOnPoll = async (
  postCode: string, 
  optionId: number
): Promise<VoteResponse> => {
  if (!postCode || typeof optionId === 'undefined') {
    console.error('voteOnPoll: postCode and optionId are required.');
    return {
      success: false,
      message: 'Post code and option ID are required to vote.',
    };
  }

  console.log(`Attempting to vote on poll: ${postCode}, option: ${optionId}`);

  try {
    const response = await fetch(`/api/polls/${postCode}/vote`, {
      method: 'POST',
      headers: createAuthHeaders(), // createAuthHeaders should set 'Content-Type': 'application/json'
      body: JSON.stringify({ option_id: optionId }),
      credentials: 'include',
    });

    const responseData: VoteResponse = await response.json();
    console.log('API Response (voteOnPoll):', responseData);

    if (!response.ok) {
      const errorMessage = responseData?.message || `Failed to cast vote. Server responded with status: ${response.status}`;
      console.error("Vote on Poll API Error (response not ok):", errorMessage, responseData);
      return {
        success: false,
        message: errorMessage,
        errCode: responseData?.errCode, // Propagate errCode
        community: responseData?.community, // Propagate community
      };
    }
    
    // According to spec, response.ok should align with responseData.success, but double-check
    if (!responseData.success) {
        console.warn("Vote on Poll API returned success:false in body:", responseData);
        return {
            success: false,
            message: responseData.message || "Vote was not recorded successfully by the server.",
            errCode: responseData?.errCode, // Propagate errCode
            community: responseData?.community, // Propagate community
        };
    }

    // If response.ok and responseData.success is true
    return {
      success: true,
      message: responseData.message || "Vote recorded successfully.",
      chosen_option_id: responseData.chosen_option_id, 
    };

  } catch (error: any) {
    console.error('Network or other error in voteOnPoll:', error);
    return {
      success: false,
      message: error.message || 'An unexpected network error occurred while casting your vote.',
    };
  }
}; 