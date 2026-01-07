/**
 * Welcome Email Preview
 * 
 * Development endpoint to preview the welcome email template.
 * Access at: /api/preview/welcome-email
 */

import { NextResponse } from "next/server";
import { generateWelcomeEmailHtml } from "@/lib/email/templates/welcome";

export async function GET() {
  const html = generateWelcomeEmailHtml({
    userName: "John Doe",
    userEmail: "john@example.com",
  });

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html",
    },
  });
}
