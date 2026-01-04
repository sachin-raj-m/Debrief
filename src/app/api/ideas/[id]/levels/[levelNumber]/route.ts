import { NextRequest } from "next/server";
import { createServerClient, getUser } from "@/lib/supabase/server";
import {
    successResponse,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    withErrorHandling,
} from "@/lib/api/errors";

interface RouteContext {
    params: Promise<{ id: string; levelNumber: string }>;
}

/**
 * PUT /api/ideas/[id]/levels/[levelNumber]
 * Upsert data for a specific level.
 */
export const PUT = withErrorHandling(async (request: NextRequest, context: RouteContext) => {
    const { id, levelNumber } = await context.params;
    const levelNum = parseInt(levelNumber, 10);
    const body = await request.json();
    const { data: levelData } = body;

    if (isNaN(levelNum) || levelNum < 1 || levelNum > 5) {
        throw new Error("Invalid level number");
    }

    const user = await getUser();
    if (!user) {
        throw new UnauthorizedError();
    }

    const supabase = await createServerClient();

    // Verify ownership of the idea
    const { data: idea, error: ideaError } = await supabase
        .from("ideas")
        .select("user_id, current_level")
        .eq("id", id)
        .single() as unknown as { data: { user_id: string; current_level: number } | null; error: any };

    if (ideaError || !idea) {
        throw new NotFoundError("Idea not found");
    }

    if (idea.user_id !== user.id) {
        throw new ForbiddenError("You can only edit your own idea journey");
    }

    // Upsert level data
    // We default status to 'in_progress' if creating new, or keep existing
    // But logic might require status management. For now, let's set to 'completed' if finishing?
    // The requirement says "Levels 1-5 are locked until previous is done".
    // For this simple update, we just save the data.
    // If we want to mark as completed, maybe we need a separate action or pass it in body.
    // Let's assume this endpoint saves draft state ('in_progress') or updates data.

    // Check if level already exists to get its ID (reliable upsert)
    const { data: existingLevel } = await supabase
        .from("idea_levels")
        .select("id")
        .eq("idea_id", id)
        .eq("level_number", levelNum)
        .maybeSingle(); // Use maybeSingle to avoid 406 error if not found

    const payload: any = {
        idea_id: id,
        level_number: levelNum,
        data: levelData,
        status: "in_progress",
        updated_at: new Date().toISOString(),
    };

    if (existingLevel) {
        payload.id = existingLevel.id;
    }

    const { data: updatedLevel, error } = await supabase
        .from("idea_levels")
        .upsert(payload)
        .select()
        .single() as unknown as { data: any; error: any };

    if (error) {
        throw error;
    }

    // Check if we should unlock the next level
    // If we are saving Level N, and current_level is N (or less), we effectively complete Level N.
    // So we should advance current_level to N + 1 (unlocking the next level).
    if (idea.current_level <= levelNum) {
        await supabase
            .from("ideas")
            .update({ current_level: levelNum + 1 })
            .eq("id", id);
    }

    return successResponse({ data: updatedLevel });
});
