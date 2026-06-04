import { getResend } from "./client";
import { ADMIN_EMAIL } from "@/lib/env";

const FROM = process.env.EMAIL_FROM ?? "HooNott Portal <noreply@hoonott.com>";
const APP_URL =
  process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";

function safeAppUrl(): string {
  return APP_URL.replace(/\/$/, "");
}

export async function sendAdminNewSignupEmail(args: {
  name: string | null;
  email: string;
  phone: string | null;
  method: "credentials" | "google";
}) {
  const { name, email, phone, method } = args;
  const adminUrl = `${safeAppUrl()}/admin`;
  const subject = `[HooNott] New signup: ${name ?? email}`;
  const html = `
    <h2>New signup request</h2>
    <p>Someone signed up for HooNott Portal and is waiting for your approval.</p>
    <ul>
      <li><strong>Name:</strong> ${escapeHtml(name ?? "—")}</li>
      <li><strong>Email:</strong> ${escapeHtml(email)}</li>
      <li><strong>Phone:</strong> ${escapeHtml(phone ?? "—")}</li>
      <li><strong>Method:</strong> ${method === "google" ? "Google sign-in" : "Email + password"}</li>
    </ul>
    <p><a href="${adminUrl}">Open the admin dashboard</a> to approve or reject.</p>
  `;
  try {
    await getResend().emails.send({
      from: FROM,
      to: ADMIN_EMAIL,
      subject,
      html,
    });
  } catch (err) {
    console.error("[email] admin signup notify failed", err);
  }
}

export async function sendPasswordResetEmail(args: {
  to: string;
  token: string;
}) {
  const url = `${safeAppUrl()}/reset-password?token=${encodeURIComponent(
    args.token
  )}&email=${encodeURIComponent(args.to)}`;
  const html = `
    <h2>Reset your HooNott Portal password</h2>
    <p>Click the link below to set a new password. The link expires in 1 hour.</p>
    <p><a href="${url}">Reset password</a></p>
    <p>If you didn't request this, you can safely ignore this email.</p>
  `;
  await getResend().emails.send({
    from: FROM,
    to: args.to,
    subject: "Reset your HooNott Portal password",
    html,
  });
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
