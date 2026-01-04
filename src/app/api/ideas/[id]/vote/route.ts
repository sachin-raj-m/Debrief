/**
 * Vote API Route
 * 
 * POST /api/ideas/[id]/vote - Cast or update a vote
 * DELETE /api/ideas/[id]/vote - Remove a vote
 * 
 * Votes are atomic and idempotent via database triggers.
 */

import { NextRequest } from "next/server";
import { getUser, createAdminClient, createServerClient } from "@/lib/supabase/server";
import { castVoteSchema } from "@/lib/validations/votes";
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

interface VoteRow {
  idea_id: string;
  user_id: string;
  value: number;
  created_at: string;
  updated_at: string;
}

interface IdeaCounts {
  upvotes_count: number;
  downvotes_count: number;
}

/**
 * POST /api/ideas/[id]/vote
 * Cast or update a vote (atomic via database trigger)
 */
export const POST = withErrorHandling(async (request: NextRequest, context: RouteContext) => {
  const { id: ideaId } = await context.params;
  const user = await getUser();

  if (!user) {
    throw new UnauthorizedError();
  }

  // Check rate limit
  const rateLimitResult = await rateLimiters.vote(user.id);
  if (!rateLimitResult.success) {
    throw new RateLimitError(
      rateLimitResult.retryAfter!,
      "Too many votes. Please slow down."
    );
  }

  // Validate request body
  const body = await request.json();
  const { value } = castVoteSchema.parse(body);

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

  // Use admin client for atomic upsert
  // The database trigger will handle counter updates atomically
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("votes")
    .upsert(
      {
        idea_id: ideaId,
        user_id: user.id,
        value,
        updated_at: new Date().toISOString(),
      } as Record<string, unknown>,
      {
        onConflict: "idea_id,user_id",
      }
    )
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const vote = data as unknown as VoteRow;

  // Fetch updated counts
  const { data: countsData } = await supabase
    .from("ideas")
    .select("upvotes_count, downvotes_count")
    .eq("id", ideaId)
    .single();

  const counts = (countsData || { upvotes_count: 0, downvotes_count: 0 }) as IdeaCounts;

  return successResponse({
    data: {
      idea_id: ideaId,
      value: vote.value,
      upvotes_count: counts.upvotes_count,
      downvotes_count: counts.downvotes_count,
    },
  });
});

/**
 * DELETE /api/ideas/[id]/vote
 * Remove a vote (atomic via database trigger)
 */
export const DELETE = withErrorHandling(async (request: NextRequest, context: RouteContext) => {
  const { id: ideaId } = await context.params;
  const user = await getUser();

  if (!user) {
    throw new UnauthorizedError();
  }

  // Use admin client for delete
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("votes")
    .delete()
    .eq("idea_id", ideaId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  // Fetch updated counts
  const supabase = await createServerClient();
  const { data: countsData } = await supabase
    .from("ideas")
    .select("upvotes_count, downvotes_count")
    .eq("id", ideaId)
    .single();

  const counts = (countsData || { upvotes_count: 0, downvotes_count: 0 }) as IdeaCounts;

  return successResponse({
    data: {
      idea_id: ideaId,
      upvotes_count: counts.upvotes_count,
      downvotes_count: counts.downvotes_count,
    },
  });
});
