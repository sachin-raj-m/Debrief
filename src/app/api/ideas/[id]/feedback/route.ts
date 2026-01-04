import { NextRequest } from "next/server";
import { createServerClient, getUser } from "@/lib/supabase/server";
import {
    successResponse,
    UnauthorizedError,
    withErrorHandling,
} from "@/lib/api/errors";
import { awardKarma } from "@/lib/gamification";
import { enrichWithProfiles } from "@/lib/db-utils";

interface RouteContext {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/ideas/[id]/feedback
 * Fetch all feedback for an idea, optionally filtered by level_number via query param.
 */
export const GET = withErrorHandling(async (request: NextRequest, context: RouteContext) => {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const levelNumber = searchParams.get("level");

    const supabase = await createServerClient();

    let query = supabase
        .from("idea_feedback")
        .select("*")
        .eq("idea_id", id)
        .order("created_at", { ascending: false })
        .limit(50); // Optimization: Limit to latest 50

    if (levelNumber) {
        query = query.eq("level_number", parseInt(levelNumber, 10));
    }

    const { data: feedbacks, error } = await query;

    if (error) throw error;

    // Use helper to fetch profiles
    const enrichedData = await enrichWithProfiles(feedbacks || [], supabase);

    return successResponse({ data: enrichedData });
});


/**
 * POST /api/ideas/[id]/feedback
 * Submit feedback for a specific level.
 */
export const POST = withErrorHandling(async (request: NextRequest, context: RouteContext) => {
    const { id } = await context.params;
    const user = await getUser();

    if (!user) {
        throw new UnauthorizedError();
    }

    const body = await request.json();
    const { level_number, content, ratings } = body;

    if (!level_number || !content) {
        throw new Error("Level number and content are required");
    }

    const supabase = await createServerClient();

    const { data: feedback, error } = await supabase
        .from("idea_feedback")
        .insert({
            idea_id: id,
            user_id: user.id,
            level_number,
            content,
            ratings: ratings || {},
        } as any)
        .select("*")
        .single();

    if (error) throw error;

    // Gamification: Award Karma for giving feedback
    try {
        await awardKarma(user.id, 5); // +5 for feedback
    } catch (e) {
        console.error("Gamification error:", e);
    }

    // Fetch author profile (current user)
    const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .eq("id", user.id)
        .single();

    const enrichedData = {
        ...(feedback as any),
        author: profile || {
            id: user.id,
            full_name: user.user_metadata?.full_name,
            avatar_url: user.user_metadata?.avatar_url
        }
    };

    return successResponse({ data: enrichedData });
});

