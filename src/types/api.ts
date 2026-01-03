/**
 * API Types for MuPoll
 * Request/Response types for API routes
 */

import type { IdeaWithAuthor, IdeaWithDetails, CommentWithAuthor } from "./database";

// ===================================
// PAGINATION
// ===================================
export interface CursorPaginationParams {
  cursor?: string; // ISO timestamp + id for cursor
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

// ===================================
// IDEAS
// ===================================
export interface CreateIdeaRequest {
  title: string;
  description: string;
}

export interface CreateIdeaResponse {
  data: IdeaWithAuthor;
}

export interface GetIdeasResponse extends PaginatedResponse<IdeaWithDetails> {}

export interface GetIdeaResponse {
  data: IdeaWithDetails;
}

// ===================================
// VOTES
// ===================================
export interface CastVoteRequest {
  value: 1 | -1;
}

export interface CastVoteResponse {
  data: {
    idea_id: string;
    value: 1 | -1;
    upvotes_count: number;
    downvotes_count: number;
  };
}

export interface RemoveVoteResponse {
  data: {
    idea_id: string;
    upvotes_count: number;
    downvotes_count: number;
  };
}

// ===================================
// COMMENTS
// ===================================
export interface CreateCommentRequest {
  content: string;
}

export interface CreateCommentResponse {
  data: CommentWithAuthor;
}

export interface GetCommentsResponse extends PaginatedResponse<CommentWithAuthor> {}

// ===================================
// AUTH
// ===================================
export interface AuthUser {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

// ===================================
// ERROR RESPONSES
// ===================================
export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}

export interface RateLimitError extends ApiError {
  retryAfter: number; // seconds until retry
}
