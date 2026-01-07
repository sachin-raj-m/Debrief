/**
 * Invite Collaborator API Route
 * 
 * POST /api/ideas/[id]/invite - Invite a team member to collaborate on an idea
 */

import { NextRequest } from "next/server";
import { createServerClient, getUser } from "@/lib/supabase/server";
import {
  successResponse,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
  ConflictError,
  withErrorHandling,
} from "@/lib/api/errors";
import { inviteCollaboratorSchema } from "@/lib/validations/collaborators";
import { sendEmail } from "@/lib/email/email";
import { generateInviteEmailHtml, generateInviteEmailText } from "@/lib/email/templates/invite";
import { ZodError } from "zod";
import type { Idea, IdeaCollaborator } from "@/types/database";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/ideas/[id]/invite
 * Invites a collaborator to the idea with a specific role
 */
export const POST = withErrorHandling(async (request: NextRequest, context: RouteContext) => {
  const { id: ideaId } = await context.params;
  const user = await getUser();

  if (!user) {
    throw new UnauthorizedError();
  }

  // Parse and validate request body
  const body = await request.json();
  let validatedData;
  
  try {
    validatedData = inviteCollaboratorSchema.parse(body);
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

  const { email, role } = validatedData;
  const supabase = await createServerClient();

  // 1. Verify idea exists and get owner info + title for email
  const { data: idea, error: ideaError } = await supabase
    .from("ideas")
    .select("id, user_id, title")
    .eq("id", ideaId)
    .single();

  if (ideaError || !idea) {
    throw new NotFoundError("Idea not found");
  }

  // 2. Check if user has permission to invite (owner or admin)
  const isOwner = idea.user_id === user.id;
  
  if (!isOwner) {
    // Check if user is an admin collaborator
    const { data: userCollaboration } = await supabase
      .from("idea_collaborators")
      .select("role, status")
      .eq("idea_id", ideaId)
      .eq("user_id", user.id)
      .eq("status", "accepted")
      .eq("role", "admin")
      .single();

    if (!userCollaboration) {
      throw new ForbiddenError("Only idea owners and admins can invite collaborators");
    }
  }

  // 3. Prevent inviting the idea owner
  const { data: inviteeProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .single();

  if (inviteeProfile && inviteeProfile.id === idea.user_id) {
    throw new ConflictError("Cannot invite the idea owner as a collaborator");
  }

  // 4. Check for existing collaboration or pending invite
  const { data: existingCollaborator } = await supabase
    .from("idea_collaborators")
    .select("id, status, role, expires_at")
    .eq("idea_id", ideaId)
    .eq("email", email)
    .single();

  if (existingCollaborator) {
    if (existingCollaborator.status === "accepted") {
      throw new ConflictError(
        `${email} is already a ${existingCollaborator.role} on this idea`
      );
    }
    
    if (existingCollaborator.status === "pending") {
      const expiresAt = new Date(existingCollaborator.expires_at);
      if (expiresAt > new Date()) {
        throw new ConflictError(
          `An invitation to ${email} is already pending (expires ${expiresAt.toLocaleDateString()})`
        );
      }
      
      // Delete expired invitation and continue
      await supabase
        .from("idea_collaborators")
        .delete()
        .eq("id", existingCollaborator.id);
    }
    
    if (existingCollaborator.status === "declined") {
      // Delete declined invitation and allow re-invite
      await supabase
        .from("idea_collaborators")
        .delete()
        .eq("id", existingCollaborator.id);
    }
  }

  // 5. Generate secure invite token
  const { data: tokenData, error: tokenError } = await supabase
    .rpc("generate_invite_token");

  if (tokenError || !tokenData) {
    throw new Error("Failed to generate invite token");
  }

  const inviteToken = tokenData as string;

  // 6. Create invitation record
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

  const { data: collaborator, error: insertError } = await supabase
    .from("idea_collaborators")
    .insert({
      idea_id: ideaId,
      email,
      role,
      status: "pending",
      invited_by: user.id,
      invite_token: inviteToken,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (insertError || !collaborator) {
    throw new Error(`Failed to create invitation: ${insertError?.message || "Unknown error"}`);
  }

  // 7. Send invitation email (non-blocking - invitation succeeds even if email fails)
  try {
    // Get inviter's name for the email
    const { data: inviterProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    const inviterName = inviterProfile?.full_name || "A team member";
    const ideaTitle = idea.title || "an idea";

    const emailResult = await sendEmail({
      to: email,
      subject: `${inviterName} invited you to collaborate on "${ideaTitle}"`,
      html: generateInviteEmailHtml({
        recipientEmail: email,
        inviterName,
        ideaTitle,
        role,
        inviteToken,
      }),
      text: generateInviteEmailText({
        recipientEmail: email,
        inviterName,
        ideaTitle,
        role,
        inviteToken,
      }),
    });

    if (!emailResult.success) {
      console.warn(`[Invite] Email sending failed for ${email}: ${emailResult.error}`);
    }
  } catch (emailError) {
    // Log but don't fail the invitation
    console.error("[Invite] Email sending error:", emailError);
  }

  return successResponse({
    data: collaborator,
  });
});
