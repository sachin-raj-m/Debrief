/**
 * Version History API Route
 * 
 * GET /api/ideas/[id]/history - Get all versions including current state
 */

import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import {
  successResponse,
  NotFoundError,
  withErrorHandling,
} from "@/lib/api/errors";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/ideas/[id]/history
 * Returns chronological list of versions + current live version
 */
export const GET = withErrorHandling(async (request: NextRequest, context: RouteContext) => {
  const { id } = await context.params;
  const supabase = await createServerClient();

  // 1. Fetch current idea
  const { data: idea, error: ideaError } = await supabase
    .from("ideas")
    .select("id, title, description, current_level, created_at")
    .eq("id", id)
    .single() as { data: any; error: any };

  if (ideaError || !idea) {
    throw new NotFoundError("Idea not found");
  }

  // 2. Fetch all versions
  const { data: versions, error: versionsError } = await supabase
    .from("idea_versions")
    .select("*")
    .eq("idea_id", id)
    .order("version_number", { ascending: true }) as { data: any[] | null; error: any };

  if (versionsError) {
    throw new Error(`Failed to fetch versions: ${versionsError.message}`);
  }

  // 3. Combine versions + current as "latest"
  const history = [
    ...(versions || []).map(v => ({ ...v, is_current: false })),
    {
      id: idea.id,
      idea_id: idea.id,
      version_number: (versions?.length || 0) + 1,
      title: idea.title,
      description: idea.description,
      current_level_at_pivot: idea.current_level,
      pivot_reason: null,
      created_at: idea.created_at,
      is_current: true,
    },
  ];

  return successResponse({ data: history });
});
