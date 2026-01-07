/**
 * Base Email Template Utilities
 * 
 * Shared styling constants and helpers for consistent email design.
 * Modern dark blue theme inspired by premium SaaS aesthetics.
 */

import { publicEnv } from "@/lib/env.server";

/**
 * Color palette for email templates
 * Vibrant electric blue theme inspired by modern tech aesthetics
 */
export const COLORS = {
  // Backgrounds - Electric blue primary
  bgPrimary: "#0052FF",
  bgCard: "#0041CC",
  bgDark: "#001A4D",
  
  // Text
  textPrimary: "#ffffff",
  textSecondary: "rgba(255, 255, 255, 0.85)",
  textMuted: "rgba(255, 255, 255, 0.6)",
  
  // Accents
  accent: "#ffffff",
  accentDark: "rgba(255, 255, 255, 0.1)",
  
  // Borders
  border: "rgba(255, 255, 255, 0.15)",
  borderLight: "rgba(255, 255, 255, 0.08)",
} as const;

/**
 * Typography styles
 */
export const TYPOGRAPHY = {
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  heading: "font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;",
  body: "font-size: 16px; line-height: 1.6;",
} as const;

/**
 * Escape HTML special characters to prevent XSS
 */
export function escapeHtml(text: string): string {
  const htmlEscapes: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return text.replace(/[&<>"']/g, (char) => htmlEscapes[char] || char);
}

/**
 * Generate the base HTML structure for all emails
 */
export function generateEmailBase(content: string, title: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${escapeHtml(title)}</title>
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
<body style="margin: 0; padding: 0; background-color: ${COLORS.bgPrimary}; font-family: ${TYPOGRAPHY.fontFamily};">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: ${COLORS.bgPrimary};">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        ${content}
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}

/**
 * Generate the email footer
 */
export function generateFooter(message?: string): string {
  const defaultMessage = "You received this email from Debrief.";
  return `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 520px;">
  <tr>
    <td style="padding: 32px 20px;">
      <p style="margin: 0; color: ${COLORS.textMuted}; font-size: 12px; line-height: 1.5; text-align: center;">
        ${message || defaultMessage}<br>
        <a href="${publicEnv.NEXT_PUBLIC_APP_URL}" style="color: ${COLORS.textSecondary}; text-decoration: none;">debrief.app</a>
      </p>
    </td>
  </tr>
</table>
`.trim();
}

/**
 * Generate a styled CTA button
 */
export function generateButton(text: string, url: string): string {
  return `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
  <tr>
    <td align="center" style="padding: 24px 0;">
      <a href="${url}" style="display: inline-block; background-color: ${COLORS.textPrimary}; color: ${COLORS.bgDark}; text-decoration: none; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; padding: 16px 40px; border-radius: 6px;">
        ${escapeHtml(text)}
      </a>
    </td>
  </tr>
</table>
`.trim();
}

/**
 * Generate a styled info card
 */
export function generateCard(content: string): string {
  return `
<table role="presentation" cellspacing="0" cellpadding="0" style="width: 100%; background-color: ${COLORS.bgCard}; border: 1px solid ${COLORS.border}; border-radius: 12px;">
  <tr>
    <td style="padding: 32px;">
      ${content}
    </td>
  </tr>
</table>
`.trim();
}
