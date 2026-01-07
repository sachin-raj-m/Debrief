/**
 * Email Service
 * 
 * Production-grade email service using Nodemailer with AWS SES SMTP.
 * Implements secure credential handling, connection pooling, and error resilience.
 */

import "server-only";
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { serverEnv } from "@/lib/env.server";

// Singleton transporter instance for connection pooling
let transporter: Transporter | null = null;

/**
 * Get or create the email transporter
 * Uses connection pooling for efficiency
 */
function getTransporter(): Transporter | null {
  if (!serverEnv.isEmailConfigured) {
    console.warn("[Email] Email not configured - missing SMTP credentials");
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: serverEnv.EMAIL_HOST!,
      port: serverEnv.EMAIL_PORT,
      secure: false, // Use STARTTLS (standard for port 587)
      auth: {
        user: serverEnv.EMAIL_HOST_USER!,
        pass: serverEnv.EMAIL_HOST_PASSWORD!,
      },
      pool: true, // Enable connection pooling
      maxConnections: 5,
      maxMessages: 100,
      // Timeout settings for reliability
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,
      socketTimeout: 30000, // 30 seconds for sending
    });
  }

  return transporter;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send an email using the configured SMTP transport
 * 
 * @param options - Email options (to, subject, html, text)
 * @returns Result object with success status and optional error
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const transport = getTransporter();
  
  if (!transport) {
    return {
      success: false,
      error: "Email service not configured",
    };
  }

  try {
    const result = await transport.sendMail({
      from: `"Debrief" <${serverEnv.FROM_MAIL}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || stripHtml(options.html),
    });

    console.log(`[Email] Sent successfully to ${options.to}, messageId: ${result.messageId}`);
    
    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`[Email] Failed to send to ${options.to}:`, errorMessage);
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Verify SMTP connection is working
 * Useful for health checks
 */
export async function verifyEmailConnection(): Promise<boolean> {
  const transport = getTransporter();
  
  if (!transport) {
    return false;
  }

  try {
    await transport.verify();
    console.log("[Email] SMTP connection verified successfully");
    return true;
  } catch (error) {
    console.error("[Email] SMTP connection verification failed:", error);
    return false;
  }
}

/**
 * Basic HTML to plain text conversion
 * Strips HTML tags for email text fallback
 */
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .trim();
}
