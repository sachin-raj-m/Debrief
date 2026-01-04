import { NextRequest } from "next/server";
import { createServerClient, getUser } from "@/lib/supabase/server";
import {
    successResponse,
    UnauthorizedError,
    withErrorHandling,
} from "@/lib/api/errors";

interface RouteContext {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/ideas/[id]/feedback
 * Fetch all feedback for an idea, optionally filtered by level_number via query param.
 */
export async function GET(request: NextRequest, context: RouteContext) {
    return withErrorHandling(async () => {
        const { id } = await context.params;
        const { searchParams } = new URL(request.url);
        const levelNumber = searchParams.get("level");

        const supabase = await createServerClient();

        let query = supabase
            .from("idea_feedback")
            .select(`
                *,
                author:auth.users!user_id(
                    id,
                    full_name,
                    avatar_url
                )
            `)
            .eq("idea_id", id)
            .order("created_at", { ascending: false });

        if (levelNumber) {
            query = query.eq("level_number", parseInt(levelNumber, 10));
        }

        const { data, error } = await query;

        if (error) throw error;

        return successResponse({ data });
    });
}

/**
 * POST /api/ideas/[id]/feedback
 * Submit feedback for a specific level.
 */
export async function POST(request: NextRequest, context: RouteContext) {
    return withErrorHandling(async () => {
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

        const { data, error } = await supabase
            .from("idea_feedback")
            .insert({
                idea_id: id,
                user_id: user.id,
                level_number,
                content,
                ratings: ratings || {},
            } as any)
            .select(`
                *,
                author:auth.users!user_id(
                    id,
                    full_name,
                    avatar_url
                )
            `)
            .single();

        if (error) throw error;

        return successResponse({ data });
    });
}
