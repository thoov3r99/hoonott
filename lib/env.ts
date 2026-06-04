function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function optionalEnv(name: string): string | undefined {
  return process.env[name];
}

export const env = {
  databaseUrl: () => requireEnv("DATABASE_URL"),
  authSecret: () => requireEnv("AUTH_SECRET"),
  googleClientId: () => requireEnv("AUTH_GOOGLE_ID"),
  googleClientSecret: () => requireEnv("AUTH_GOOGLE_SECRET"),
  resendApiKey: () => requireEnv("RESEND_API_KEY"),
  emailFrom: () => requireEnv("EMAIL_FROM"),
  adminEmail: () => requireEnv("ADMIN_EMAIL"),
  authUrl: () => optionalEnv("AUTH_URL") ?? optionalEnv("NEXTAUTH_URL"),
};

export const ADMIN_EMAIL = (
  process.env.ADMIN_EMAIL ?? "thoover231@gmail.com"
).toLowerCase();
