/**
 * Invite Email Template
 * 
 * Modern vibrant blue email template for team collaboration invitations.
 * Includes responsive design and plain text fallback.
 */

import { publicEnv } from "@/lib/env.server";
import { COLORS, TYPOGRAPHY, escapeHtml, generateEmailBase, generateFooter, generateButton, generateCard } from "./base";

export interface InviteEmailData {
  recipientEmail: string;
  inviterName: string;
  ideaTitle: string;
  role: "viewer" | "editor" | "admin";
  inviteToken: string;
}

const ROLE_LABELS: Record<string, string> = {
  viewer: "Viewer",
  editor: "Editor",
  admin: "Admin",
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  viewer: "View the idea and track progress",
  editor: "Edit the idea and provide feedback",
  admin: "Full access including team management",
};

/**
 * Generate the invite acceptance URL
 */
export function getInviteUrl(inviteToken: string): string {
  return `${publicEnv.NEXT_PUBLIC_APP_URL}/invites/${inviteToken}/accept`;
}

/**
 * Generate the HTML email content for an invitation
 */
export function generateInviteEmailHtml(data: InviteEmailData): string {
  const inviteUrl = getInviteUrl(data.inviteToken);
  const roleLabel = ROLE_LABELS[data.role] || data.role;
  const roleDescription = ROLE_DESCRIPTIONS[data.role] || "";

  const content = `
<!-- Main Container -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 520px;">
  <tr>
    <td style="padding: 20px;">
      <!-- Header Text -->
      <p style="margin: 0 0 8px 0; color: ${COLORS.textPrimary}; font-size: 14px; font-weight: 400; line-height: 1.4;">
        HEY,
      </p>
      <p style="margin: 0 0 32px 0; color: ${COLORS.textPrimary}; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.02em; line-height: 1.5;">
        ${escapeHtml(data.inviterName.toUpperCase())} HAS INVITED YOU TO COLLABORATE ON AN IDEA:
      </p>

      <!-- Idea Card -->
      <table role="presentation" cellspacing="0" cellpadding="0" style="width: 100%; background-color: ${COLORS.bgCard}; border-radius: 16px; margin-bottom: 32px;">
        <tr>
          <td style="padding: 32px;">
            <!-- Idea Number/Indicator -->
            <p style="margin: 0 0 8px 0; color: ${COLORS.textMuted}; font-size: 32px; font-weight: 300; font-family: monospace;">
              //01
            </p>
            <!-- Idea Title -->
            <h1 style="margin: 0 0 16px 0; color: ${COLORS.textPrimary}; font-size: 28px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.02em; line-height: 1.2;">
              ${escapeHtml(data.ideaTitle)}
            </h1>
            <!-- Role Info -->
            <table role="presentation" cellspacing="0" cellpadding="0">
              <tr>
                <td style="padding-right: 24px;">
                  <p style="margin: 0 0 4px 0; color: ${COLORS.textMuted}; font-size: 10px; font-weight: 400; text-transform: uppercase; letter-spacing: 0.1em;">
                    YOUR ROLE
                  </p>
                  <p style="margin: 0; color: ${COLORS.textPrimary}; font-size: 13px; font-weight: 600;">
                    ${roleLabel}
                  </p>
                </td>
                <td>
                  <p style="margin: 0 0 4px 0; color: ${COLORS.textMuted}; font-size: 10px; font-weight: 400; text-transform: uppercase; letter-spacing: 0.1em;">
                    ACCESS
                  </p>
                  <p style="margin: 0; color: ${COLORS.textPrimary}; font-size: 13px; font-weight: 600;">
                    ${roleDescription}
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Description Text -->
      <p style="margin: 0 0 24px 0; color: ${COLORS.textPrimary}; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.02em; line-height: 1.6;">
        CLICK THE BUTTON BELOW TO JOIN THE TEAM AND START COLLABORATING. YOU'LL GET ACCESS TO ALL THE DETAILS INSTANTLY.
      </p>

      <!-- CTA Button -->
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding: 8px 0 32px 0;">
            <a href="${inviteUrl}" style="display: inline-block; background-color: ${COLORS.textPrimary}; color: ${COLORS.bgPrimary}; text-decoration: none; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; padding: 16px 40px; border-radius: 6px;">
              Accept Invitation
            </a>
          </td>
        </tr>
      </table>

      <!-- Expiry Notice -->
      <p style="margin: 0 0 16px 0; color: ${COLORS.textSecondary}; font-size: 12px; line-height: 1.5;">
        This invitation expires in 7 days. If you didn't expect this, just ignore it.
      </p>

      <!-- Divider -->
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top: 1px solid ${COLORS.border}; margin-top: 24px;">
        <tr>
          <td style="padding-top: 24px;">
            <p style="margin: 0 0 8px 0; color: ${COLORS.textMuted}; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;">
              CAN'T CLICK THE BUTTON?
            </p>
            <p style="margin: 0; color: ${COLORS.textSecondary}; font-size: 12px; line-height: 1.5; word-break: break-all;">
              ${inviteUrl}
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

${generateFooter("You received this because someone invited you to collaborate on Debrief.")}
`;

  return generateEmailBase(content, "You're invited to collaborate");
}

/**
 * Generate plain text version of the invite email
 */
export function generateInviteEmailText(data: InviteEmailData): string {
  const inviteUrl = getInviteUrl(data.inviteToken);
  const roleLabel = ROLE_LABELS[data.role] || data.role;
  const roleDescription = ROLE_DESCRIPTIONS[data.role] || "";

  return `
HEY,

${data.inviterName.toUpperCase()} HAS INVITED YOU TO COLLABORATE ON AN IDEA:

"${data.ideaTitle}"

Your Role: ${roleLabel}
Access: ${roleDescription}

Click here to accept: ${inviteUrl}

This invitation expires in 7 days.

---
You received this because someone invited you to collaborate on Debrief.
`.trim();
}

