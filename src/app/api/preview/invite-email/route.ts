/**
 * Invite Email Preview
 * 
 * Development endpoint to preview the invite email template.
 * Access at: /api/preview/invite-email
 */

import { NextResponse } from "next/server";
import { generateInviteEmailHtml } from "@/lib/email/templates/invite";

export async function GET() {
  const html = generateInviteEmailHtml({
    recipientEmail: "invitee@example.com",
    inviterName: "Jane Smith",
    ideaTitle: "Revolutionary AI Health Assistant",
    role: "editor",
    inviteToken: "demo-token-123",
  });

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html",
    },
  });
}
