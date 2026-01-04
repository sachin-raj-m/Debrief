/**
 * Comments API Route
 * 
 * GET /api/ideas/[id]/comments - List comments with pagination
 * POST /api/ideas/[id]/comments - Create a new comment
 */

import { NextRequest } from "next/server";
import { createServerClient, getUser, createAdminClient } from "@/lib/supabase/server";
import { createCommentSchema, getCommentsQuerySchema } from "@/lib/validations/comments";
import { rateLimiters } from "@/lib/rate-limit";
import {
  successResponse,
  UnauthorizedError,
  NotFoundError,
  RateLimitError,
  withErrorHandling,
} from "@/lib/api/errors";

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface CommentRow {
  id: string;
  idea_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface ProfileRow {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

/**
 * GET /api/ideas/[id]/comments
 * Fetch paginated comments for an idea
 */
export const GET = withErrorHandling(async (request: NextRequest, context: RouteContext) => {
  const { id: ideaId } = await context.params;
  const searchParams = request.nextUrl.searchParams;

  const query = getCommentsQuerySchema.parse({
    cursor: searchParams.get("cursor") || undefined,
    limit: searchParams.get("limit") || undefined,
  });

  const supabase = await createServerClient();

  // Verify idea exists
  const { data: ideaData } = await supabase
    .from("ideas")
    .select("id")
    .eq("id", ideaId)
    .single();

  if (!ideaData) {
    throw new NotFoundError("Idea not found");
  }

  // Build query
  let dbQuery = supabase
    .from("comments")
    .select("*")
    .eq("idea_id", ideaId)
    .order("created_at", { ascending: false })
    .limit(query.limit + 1);

  // Apply cursor pagination
  if (query.cursor) {
    const [timestamp, id] = query.cursor.split("_");
    dbQuery = dbQuery.or(
      `created_at.lt.${timestamp},and(created_at.eq.${timestamp},id.lt.${id})`
    );
  }

  const { data, error } = await dbQuery;

  if (error) {
    throw new Error(error.message);
  }

  const comments = (data || []) as unknown as CommentRow[];

  // Check if there are more results
  const hasMore = comments.length > query.limit;
  const resultsToReturn = hasMore ? comments.slice(0, -1) : comments;

  // Get unique user IDs and fetch profiles
  const userIds = [...new Set(resultsToReturn.map((c) => c.user_id))];
  let profiles: Record<string, ProfileRow> = {};

  if (userIds.length > 0) {
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", userIds);

    if (profilesData) {
      profiles = Object.fromEntries(
        (profilesData as unknown as ProfileRow[]).map((p) => [p.id, p])
      );
    }
  }

  // Combine comments with authors
  const commentsWithAuthors = resultsToReturn.map((comment) => ({
    ...comment,
    author: profiles[comment.user_id] || { id: comment.user_id, full_name: null, avatar_url: null },
  }));

  // Generate next cursor
  const lastComment = resultsToReturn[resultsToReturn.length - 1];
  const nextCursor =
    hasMore && lastComment
      ? `${lastComment.created_at}_${lastComment.id}`
      : null;

  return successResponse({
    data: commentsWithAuthors,
    nextCursor,
    hasMore,
  });
});

/**
 * POST /api/ideas/[id]/comments
 * Create a new comment (authenticated, rate-limited)
 */
export const POST = withErrorHandling(async (request: NextRequest, context: RouteContext) => {
  const { id: ideaId } = await context.params;
  const user = await getUser();

  if (!user) {
    throw new UnauthorizedError();
  }

  // Check rate limit
  const rateLimitResult = await rateLimiters.createComment(user.id);
  if (!rateLimitResult.success) {
    throw new RateLimitError(
      rateLimitResult.retryAfter!,
      "Too many comments. Please try again later."
    );
  }

  // Validate request body
  const body = await request.json();
  const { content } = createCommentSchema.parse(body);

  // Verify idea exists
  const supabase = await createServerClient();
  const { data: ideaData } = await supabase
    .from("ideas")
    .select("id")
    .eq("id", ideaId)
    .single();

  if (!ideaData) {
    throw new NotFoundError("Idea not found");
  }

  // Use admin client for insert
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("comments")
    .insert({
      idea_id: ideaId,
      user_id: user.id,
      content,
    } as Record<string, unknown>)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const comment = data as unknown as CommentRow;

  // Fetch author profile
  const { data: profileData } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .eq("id", user.id)
    .single();

  const author = (profileData as unknown as ProfileRow) || {
    id: user.id,
    full_name: user.user_metadata?.full_name || null,
    avatar_url: user.user_metadata?.avatar_url || null
  };

  return successResponse({
    data: {
      ...comment,
      author,
    },
  }, 201);
});
