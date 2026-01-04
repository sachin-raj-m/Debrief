import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { successResponse, UnauthorizedError, withErrorHandling } from "@/lib/api/errors";
import * as z from "zod";

const backSchema = z.object({
    pledge_amount: z.number().min(0).max(1000000),
    comment: z.string().max(500).optional(),
    is_anonymous: z.boolean().default(false),
});

export const POST = withErrorHandling(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const body = await request.json();
    const validatedData = backSchema.parse(body);

    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new UnauthorizedError();
    }

    // Check if backing already exists
    const { data: existingBacking } = await supabase
        .from("idea_backers")
        .select("id")
        .eq("idea_id", id)
        .eq("user_id", user.id)
        .single();

    if (existingBacking) {
        // Update existing backing
        const { data, error } = await supabase
            .from("idea_backers")
            .update({
                pledge_amount: validatedData.pledge_amount,
                comment: validatedData.comment,
                is_anonymous: validatedData.is_anonymous,
                updated_at: new Date().toISOString(),
            })
            .eq("id", existingBacking.id)
            .select()
            .single();

        if (error) throw error;
        return successResponse({ data });
    } else {
        // Create new backing
        const { data, error } = await supabase
            .from("idea_backers")
            .insert({
                idea_id: id,
                user_id: user.id,
                pledge_amount: validatedData.pledge_amount,
                comment: validatedData.comment,
                is_anonymous: validatedData.is_anonymous,
            })
            .select()
            .single();

        if (error) throw error;
        return successResponse({ data });
    }
});
