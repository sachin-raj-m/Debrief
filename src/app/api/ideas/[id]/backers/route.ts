import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { successResponse, withErrorHandling } from "@/lib/api/errors";
import { enrichWithProfiles } from "@/lib/db-utils";

export const GET = withErrorHandling(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const supabase = await createServerClient();

    const { data: backers, error } = await supabase
        .from("idea_backers")
        .select("*")
        .eq("idea_id", id)
        .order("created_at", { ascending: false });

    if (error) throw error;

    // Filter anonymous users separately if needed, but for now we enrich all
    // In UI, we will check is_anonymous to display "Anonymous" instead of name
    const enrichedBackers = await enrichWithProfiles(backers || [], supabase);

    // Calculate total pledged
    const totalPledged = backers?.reduce((sum, backer) => sum + (backer.pledge_amount || 0), 0) || 0;
    const backersCount = backers?.length || 0;

    return successResponse({
        data: enrichedBackers,
        meta: {
            total_pledged: totalPledged,
            backers_count: backersCount
        }
    });
});
