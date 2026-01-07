/**
 * Welcome Email Template
 * 
 * Modern vibrant blue email template for welcoming new users.
 * Sent after first-time signup/login.
 */

import { publicEnv } from "@/lib/env.server";
import { COLORS, escapeHtml, generateEmailBase, generateFooter } from "./base";

export interface WelcomeEmailData {
  userName: string;
  userEmail: string;
}

/**
 * Generate the HTML email content for welcome message
 */
export function generateWelcomeEmailHtml(data: WelcomeEmailData): string {
  const dashboardUrl = publicEnv.NEXT_PUBLIC_APP_URL;
  const newIdeaUrl = `${publicEnv.NEXT_PUBLIC_APP_URL}/ideas/new`;
  const firstName = data.userName.split(' ')[0] || 'there';

  const content = `
<!-- Main Container -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 520px;">
  <tr>
    <td style="padding: 20px;">
      <!-- Header Text -->
      <p style="margin: 0 0 8px 0; color: ${COLORS.textPrimary}; font-size: 14px; font-weight: 400; line-height: 1.4;">
        HEY ${escapeHtml(firstName.toUpperCase())},
      </p>
      <p style="margin: 0 0 32px 0; color: ${COLORS.textPrimary}; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.02em; line-height: 1.5;">
        WELCOME TO DEBRIEF — YOUR IDEAS JUST GOT A NEW HOME.
      </p>

      <!-- Welcome Card -->
      <table role="presentation" cellspacing="0" cellpadding="0" style="width: 100%; background-color: ${COLORS.bgCard}; border-radius: 16px; margin-bottom: 32px;">
        <tr>
          <td style="padding: 32px;">
            <!-- Indicator -->
            <p style="margin: 0 0 8px 0; color: ${COLORS.textMuted}; font-size: 32px; font-weight: 300; font-family: monospace;">
              //00
            </p>
            <!-- Title -->
            <h1 style="margin: 0 0 16px 0; color: ${COLORS.textPrimary}; font-size: 28px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.02em; line-height: 1.2;">
              THE FORGE
            </h1>
            <!-- Info -->
            <table role="presentation" cellspacing="0" cellpadding="0">
              <tr>
                <td style="padding-right: 24px;">
                  <p style="margin: 0 0 4px 0; color: ${COLORS.textMuted}; font-size: 10px; font-weight: 400; text-transform: uppercase; letter-spacing: 0.1em;">
                    STATUS
                  </p>
                  <p style="margin: 0; color: ${COLORS.textPrimary}; font-size: 13px; font-weight: 600;">
                    Ready to build
                  </p>
                </td>
                <td>
                  <p style="margin: 0 0 4px 0; color: ${COLORS.textMuted}; font-size: 10px; font-weight: 400; text-transform: uppercase; letter-spacing: 0.1em;">
                    ACCESS
                  </p>
                  <p style="margin: 0; color: ${COLORS.textPrimary}; font-size: 13px; font-weight: 600;">
                    Full platform access
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Description Text -->
      <p style="margin: 0 0 24px 0; color: ${COLORS.textPrimary}; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.02em; line-height: 1.6;">
        DEBRIEF IS WHERE YOUR IDEAS GET VALIDATED, REFINED, AND PROVEN BEFORE YOU BUILD. THINK OF IT AS YOUR IDEA'S GYM — WE'LL HELP YOU STRESS-TEST IT.
      </p>

      <!-- What's Next -->
      <p style="margin: 0 0 16px 0; color: ${COLORS.textSecondary}; font-size: 13px; line-height: 1.6;">
        Here's what you can do:
      </p>
      <table role="presentation" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
        <tr>
          <td style="padding: 8px 0;">
            <p style="margin: 0; color: ${COLORS.textPrimary}; font-size: 13px; font-weight: 600;">
              → Submit your first idea and get community feedback
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0;">
            <p style="margin: 0; color: ${COLORS.textPrimary}; font-size: 13px; font-weight: 600;">
              → Level up through the forge to refine your concept
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0;">
            <p style="margin: 0; color: ${COLORS.textPrimary}; font-size: 13px; font-weight: 600;">
              → Invite collaborators to help shape your vision
            </p>
          </td>
        </tr>
      </table>

      <!-- CTA Button -->
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding: 8px 0 32px 0;">
            <a href="${newIdeaUrl}" style="display: inline-block; background-color: ${COLORS.textPrimary}; color: ${COLORS.bgPrimary}; text-decoration: none; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; padding: 16px 40px; border-radius: 6px;">
              Create Your First Idea
            </a>
          </td>
        </tr>
      </table>

      <!-- Closing -->
      <p style="margin: 0 0 8px 0; color: ${COLORS.textPrimary}; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.02em; line-height: 1.6;">
        LET'S MAKE SOMETHING GREAT.
      </p>
      <p style="margin: 0; color: ${COLORS.textSecondary}; font-size: 13px; line-height: 1.5;">
        — The Debrief Team
      </p>
    </td>
  </tr>
</table>

${generateFooter("You received this because you signed up for Debrief.")}
`;

  return generateEmailBase(content, "Welcome to Debrief");
}

/**
 * Generate plain text version of the welcome email
 */
export function generateWelcomeEmailText(data: WelcomeEmailData): string {
  const newIdeaUrl = `${publicEnv.NEXT_PUBLIC_APP_URL}/ideas/new`;
  const firstName = data.userName.split(' ')[0] || 'there';

  return `
HEY ${firstName.toUpperCase()},

WELCOME TO DEBRIEF — YOUR IDEAS JUST GOT A NEW HOME.

Debrief is where your ideas get validated, refined, and proven before you build. Think of it as your idea's gym — we'll help you stress-test it.

Here's what you can do:
→ Submit your first idea and get community feedback
→ Level up through the forge to refine your concept
→ Invite collaborators to help shape your vision

Create your first idea: ${newIdeaUrl}

LET'S MAKE SOMETHING GREAT.

— The Debrief Team

---
You received this because you signed up for Debrief.
`.trim();
}
