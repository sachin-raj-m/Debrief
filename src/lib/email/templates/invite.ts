/**
 * Invite Email Template
 * 
 * Professional HTML email template for team collaboration invitations.
 * Includes responsive design and plain text fallback.
 */

import { publicEnv } from "@/lib/env.server";

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
  viewer: "View the idea and track all progress",
  editor: "View and edit the idea, levels, and provide feedback",
  admin: "Full access including managing team members",
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

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>You're invited to collaborate</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0a0a0a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <!-- Main Container -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: #111111; border-radius: 16px; border: 1px solid #222222;">
          <tr>
            <td style="padding: 48px 40px;">
              <!-- Logo/Header -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-bottom: 32px;">
                    <div style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); width: 56px; height: 56px; border-radius: 14px; line-height: 56px; text-align: center;">
                      <span style="color: white; font-size: 24px; font-weight: bold;">D</span>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Invitation Header -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-bottom: 24px;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600; line-height: 1.3;">
                      You're invited to collaborate!
                    </h1>
                  </td>
                </tr>
              </table>

              <!-- Invitation Body -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding-bottom: 32px;">
                    <p style="margin: 0 0 16px 0; color: #a1a1a1; font-size: 16px; line-height: 1.6; text-align: center;">
                      <strong style="color: #ffffff;">${escapeHtml(data.inviterName)}</strong> has invited you to join
                    </p>
                    <p style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 600; line-height: 1.4; text-align: center;">
                      "${escapeHtml(data.ideaTitle)}"
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Role Badge -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-bottom: 32px;">
                    <table role="presentation" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="background-color: rgba(124, 58, 237, 0.15); border: 1px solid rgba(124, 58, 237, 0.3); border-radius: 12px; padding: 16px 24px;">
                          <p style="margin: 0 0 4px 0; color: #a855f7; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                            Your Role
                          </p>
                          <p style="margin: 0 0 4px 0; color: #ffffff; font-size: 18px; font-weight: 600;">
                            ${roleLabel}
                          </p>
                          <p style="margin: 0; color: #a1a1a1; font-size: 14px;">
                            ${roleDescription}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-bottom: 32px;">
                    <a href="${inviteUrl}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 16px 48px; border-radius: 12px; box-shadow: 0 4px 14px rgba(124, 58, 237, 0.4);">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Expiry Notice -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-bottom: 24px;">
                    <p style="margin: 0; color: #666666; font-size: 13px; line-height: 1.5;">
                      This invitation expires in 7 days.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="border-top: 1px solid #222222; padding-top: 24px;">
                    <p style="margin: 0 0 8px 0; color: #666666; font-size: 12px; line-height: 1.5; text-align: center;">
                      If the button doesn't work, copy and paste this link:
                    </p>
                    <p style="margin: 0; color: #a855f7; font-size: 12px; line-height: 1.5; text-align: center; word-break: break-all;">
                      ${inviteUrl}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 520px;">
          <tr>
            <td style="padding: 24px 20px;">
              <p style="margin: 0; color: #444444; font-size: 12px; line-height: 1.5; text-align: center;">
                You received this email because someone invited you to collaborate on Debrief.<br>
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}

/**
 * Generate plain text version of the invite email
 */
export function generateInviteEmailText(data: InviteEmailData): string {
  const inviteUrl = getInviteUrl(data.inviteToken);
  const roleLabel = ROLE_LABELS[data.role] || data.role;
  const roleDescription = ROLE_DESCRIPTIONS[data.role] || "";

  return `
You're invited to collaborate!

${data.inviterName} has invited you to join "${data.ideaTitle}"

Your Role: ${roleLabel}
${roleDescription}

Accept this invitation by visiting:
${inviteUrl}

This invitation expires in 7 days.

---
You received this email because someone invited you to collaborate on Debrief.
If you didn't expect this invitation, you can safely ignore this email.
`.trim();
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const htmlEscapes: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return text.replace(/[&<>"']/g, (char) => htmlEscapes[char] || char);
}
