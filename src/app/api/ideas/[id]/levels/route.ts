import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import {
    successResponse,
    withErrorHandling,
} from "@/lib/api/errors";

interface RouteContext {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/ideas/[id]/levels
 * Get all levels for an idea
 */
export const GET = withErrorHandling(async (request: NextRequest, context: RouteContext) => {
    const { id } = await context.params;
    const supabase = await createServerClient();

    const { data, error } = await supabase
        .from("idea_levels")
        .select("*")
        .eq("idea_id", id)
        .order("level_number", { ascending: true });

    if (error) {
        throw error;
    }

    return successResponse({ data: data || [] });
});

