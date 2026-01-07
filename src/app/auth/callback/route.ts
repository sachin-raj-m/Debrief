/**
 * Auth Callback Route
 * 
 * Handles OAuth callback from Supabase Auth
 * Note: The actual redirect destination is stored in localStorage by the client
 * and handled client-side after this server redirect
 */

import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/email";
import { generateWelcomeEmailHtml, generateWelcomeEmailText } from "@/lib/email/templates/welcome";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createServerClient();
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && sessionData?.user) {
      const user = sessionData.user;
      
      // Check if this is a new user by looking for a profile
      // A profile is created on first login via database trigger, so if no profile exists
      // OR the profile was just created, this is a new user
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, created_at")
        .eq("id", user.id)
        .single();
      
      // Determine if new user:
      // - No profile exists yet (trigger might not have run)
      // - OR profile was created within last 5 minutes (just signed up)
      const isNewUser = !profile || (
        profile.created_at && 
        (Date.now() - new Date(profile.created_at).getTime()) < 5 * 60 * 1000 // 5 minutes
      );
      
      console.log(`[Auth Callback] User ${user.email}: isNewUser=${isNewUser}, profile=${profile ? 'exists' : 'none'}`);
      
      if (isNewUser && user.email) {
        console.log(`[Auth Callback] Sending welcome email to ${user.email}`);
        
        // Send welcome email asynchronously (don't block auth flow)
        sendEmail({
          to: user.email,
          subject: "Welcome to Debrief — Let's Build Something Great",
          html: generateWelcomeEmailHtml({
            userName: user.user_metadata?.full_name || user.email.split('@')[0],
            userEmail: user.email,
          }),
          text: generateWelcomeEmailText({
            userName: user.user_metadata?.full_name || user.email.split('@')[0],
            userEmail: user.email,
          }),
        }).then(() => {
          console.log(`[Auth Callback] Welcome email sent successfully to ${user.email}`);
        }).catch((err) => {
          console.error("[Auth Callback] Failed to send welcome email:", err);
        });
      }
      
      // Redirect to a client page that will handle the localStorage redirect
      return NextResponse.redirect(`${origin}/auth/redirect`);
    }
  }

  // Return to login page with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
