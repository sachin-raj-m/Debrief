/**
 * Pivot API Route
 * 
 * POST /api/ideas/[id]/pivot - Create a new pivot (version snapshot)
 */

import { NextRequest } from "next/server";
import { createServerClient, getUser } from "@/lib/supabase/server";
import {
  successResponse,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
  withErrorHandling,
} from "@/lib/api/errors";
import { createPivotSchema } from "@/lib/validations/pivots";
import { ZodError } from "zod";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/ideas/[id]/pivot
 * Creates a version snapshot of current state, then optionally updates the idea
 */
export const POST = withErrorHandling(async (request: NextRequest, context: RouteContext) => {
  const { id } = await context.params;
  const user = await getUser();

  if (!user) {
    throw new UnauthorizedError();
  }

  // Parse and validate request body
  const body = await request.json();
  let validatedData;
  
  try {
    validatedData = createPivotSchema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      const errors: Record<string, string[]> = {};
      error.issues.forEach((err) => {
        const path = err.path.join(".");
        if (!errors[path]) errors[path] = [];
        errors[path].push(err.message);
      });
      throw new ValidationError(errors);
    }
    throw error;
  }

  const { new_title, new_description, pivot_reason } = validatedData;
  const supabase = await createServerClient();

  // 1. Fetch current idea state
  const { data: idea, error: ideaError } = await supabase
    .from("ideas")
    .select("*")
    .eq("id", id)
    .single();

  if (ideaError || !idea) {
    throw new NotFoundError("Idea not found");
  }

  // 2. Verify ownership
  if (idea.user_id !== user.id) {
    throw new ForbiddenError("You can only pivot your own ideas");
  }

  // 3. Create version snapshot of CURRENT state
  const { data: version, error: versionError } = await supabase
    .from("idea_versions")
    .insert({
      idea_id: id,
      title: idea.title,
      description: idea.description,
      current_level_at_pivot: idea.current_level,
      pivot_reason,
      // version_number will be auto-set by trigger
    } as any)
    .select()
    .single();

  if (versionError || !version) {
    throw new Error(`Failed to create version: ${versionError?.message || 'Unknown error'}`);
  }

  // 4. Update idea with new data (if provided)
  let updatedIdea = idea;
  
  if (new_title || new_description) {
    const updatePayload: any = { updated_at: new Date().toISOString() };
    if (new_title) updatePayload.title = new_title;
    if (new_description) updatePayload.description = new_description;

    const { data: updated, error: updateError } = await supabase
      .from("ideas")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (updateError || !updated) {
      throw new Error(`Failed to update idea: ${updateError?.message || 'Unknown error'}`);
    }

    updatedIdea = updated;
  }

  // 5. Enrich updated idea with author profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .eq("id", updatedIdea.user_id)
    .single();

  const enrichedIdea = {
    ...updatedIdea,
    author: profile || { id: updatedIdea.user_id, full_name: null, avatar_url: null },
  };

  return successResponse({
    data: {
      version,
      updated_idea: enrichedIdea,
    },
  });
});
