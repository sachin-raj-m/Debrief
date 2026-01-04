/**
 * Ideas API Route - List & Create
 * 
 * GET /api/ideas - List ideas with cursor pagination
 * POST /api/ideas - Create a new idea (authenticated, rate-limited)
 */

import { NextRequest } from "next/server";
import { createServerClient, getUser, createAdminClient } from "@/lib/supabase/server";
import { createIdeaSchema, getIdeasQuerySchema } from "@/lib/validations/ideas";
import { rateLimiters } from "@/lib/rate-limit";
import {
  successResponse,
  UnauthorizedError,
  RateLimitError,
  withErrorHandling,
} from "@/lib/api/errors";
import { enrichWithProfiles, enrichOneWithProfile } from "@/lib/db-utils";

// Types for database responses
interface IdeaRow {
  id: string;
  user_id: string;
  title: string;
  description: string;
  upvotes_count: number;
  downvotes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
}

interface ProfileRow {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface VoteRow {
  idea_id: string;
  value: number;
}

/**
 * GET /api/ideas
 * Fetch paginated list of ideas with author info and user's vote
 */
export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const searchParams = request.nextUrl.searchParams;

    // Parse and validate query params
    const query = getIdeasQuerySchema.parse({
      cursor: searchParams.get("cursor") || undefined,
      limit: searchParams.get("limit") || undefined,
      sort: searchParams.get("sort") || undefined,
    });

    const supabase = await createServerClient();
    const user = await getUser();

    // Build query - fetch ideas without join first
    let dbQuery = supabase
      .from("ideas")
      .select("*")
      .limit(query.limit + 1);

    // Apply sorting based on sort option
    switch (query.sort) {
      case "votes_desc":
        dbQuery = dbQuery.order("upvotes_count", { ascending: false });
        break;
      case "votes_asc":
        dbQuery = dbQuery.order("upvotes_count", { ascending: true });
        break;
      case "created_asc":
        dbQuery = dbQuery.order("created_at", { ascending: true });
        break;
      case "created_desc":
      default:
        dbQuery = dbQuery.order("created_at", { ascending: false });
        break;
    }

    // Apply cursor pagination
    if (query.cursor) {
      const [timestamp, id] = query.cursor.split("_");
      dbQuery = dbQuery.or(`created_at.lt.${timestamp},and(created_at.eq.${timestamp},id.lt.${id})`);
    }

    const { data, error } = await dbQuery;

    if (error) {
      throw new Error(error.message);
    }

    const ideas = (data || []) as unknown as IdeaRow[];

    // Check if there are more results
    const hasMore = ideas.length > query.limit;
    const resultsToReturn = hasMore ? ideas.slice(0, -1) : ideas;

    // Enrich with authors efficiently
    const ideasWithAuthors = await enrichWithProfiles(resultsToReturn, supabase);

    // Get user's votes if authenticated
    let userVotes: Record<string, number> = {};
    if (user && resultsToReturn.length > 0) {
      const ideaIds = resultsToReturn.map((idea) => idea.id);
      const { data: votesData } = await supabase
        .from("votes")
        .select("idea_id, value")
        .eq("user_id", user.id)
        .in("idea_id", ideaIds);

      const votes = (votesData || []) as unknown as VoteRow[];
      userVotes = Object.fromEntries(
        votes.map((v) => [v.idea_id, v.value])
      );
    }

    // Combine ideas with votes (authors already attached)
    const ideasWithDetails = ideasWithAuthors.map((idea) => ({
      ...idea,
      user_vote: userVotes[idea.id]
        ? { idea_id: idea.id, user_id: user?.id, value: userVotes[idea.id] }
        : null,
    }));

    // Generate next cursor
    const lastIdea = resultsToReturn[resultsToReturn.length - 1];
    const nextCursor = hasMore && lastIdea
      ? `${lastIdea.created_at}_${lastIdea.id}`
      : null;

    return successResponse({
      data: ideasWithDetails,
      nextCursor,
      hasMore,
    });
  });
}

/**
 * POST /api/ideas
 * Create a new idea (authenticated, rate-limited)
 */
export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const user = await getUser();

    if (!user) {
      throw new UnauthorizedError();
    }

    // Check rate limit
    const rateLimitResult = await rateLimiters.createIdea(user.id);
    if (!rateLimitResult.success) {
      throw new RateLimitError(
        rateLimitResult.retryAfter!,
        "Too many ideas created. Please try again later."
      );
    }

    // Parse and validate body
    const body = await request.json();
    const validatedData = createIdeaSchema.parse(body);

    // Use admin client for insert
    const adminClient = createAdminClient();

    const { data, error } = await adminClient
      .from("ideas")
      .insert({
        user_id: user.id,
        title: validatedData.title,
        description: validatedData.description,
      } as any)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    const idea = data as unknown as IdeaRow;

    // Fetch author profile efficiently
    const supabase = await createServerClient();
    const enrichedIdea = await enrichOneWithProfile(idea, supabase);

    // Return the idea directly - not wrapped in data
    return successResponse({
      data: {
        ...enrichedIdea,
        user_vote: null,
      },
    }, 201);
  });
}
