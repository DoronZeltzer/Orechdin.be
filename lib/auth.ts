import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url, token }, request) => {
      // Intentionally decoupled for testability and zero-config local run
      // In production, wire to Resend / NodeMailer here.
      console.log(`[AUTH-MOCK] Verification email requested for ${user.email}`);
      console.log(`[AUTH-MOCK] Verification URL: ${url}`);
    },
  }
});
