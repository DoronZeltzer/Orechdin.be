import { pgTable, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

// Timestamp helper: Postgres `timestamptz`, surfaced to the app as JS `Date`
// (the shape better-auth and the intake code expect). Ported from the old
// SQLite `integer(..., { mode: "timestamp" })` columns.
const ts = (name: string) =>
  timestamp(name, { mode: "date", withTimezone: true });

// --- BETTER AUTH REQUIRED TABLES ---
export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("emailVerified").notNull(),
	image: text("image"),
	createdAt: ts("createdAt").notNull(),
	updatedAt: ts("updatedAt").notNull(),
});

export const session = pgTable("session", {
	id: text("id").primaryKey(),
	expiresAt: ts("expiresAt").notNull(),
	token: text("token").notNull().unique(),
	createdAt: ts("createdAt").notNull(),
	updatedAt: ts("updatedAt").notNull(),
	ipAddress: text("ipAddress"),
	userAgent: text("userAgent"),
	userId: text("userId").notNull().references(() => user.id)
});

export const account = pgTable("account", {
	id: text("id").primaryKey(),
	accountId: text("accountId").notNull(),
	providerId: text("providerId").notNull(),
	userId: text("userId").notNull().references(() => user.id),
	accessToken: text("accessToken"),
	refreshToken: text("refreshToken"),
	idToken: text("idToken"),
	accessTokenExpiresAt: ts("accessTokenExpiresAt"),
	refreshTokenExpiresAt: ts("refreshTokenExpiresAt"),
	scope: text("scope"),
	password: text("password"),
	createdAt: ts("createdAt").notNull(),
	updatedAt: ts("updatedAt").notNull()
});

export const verification = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: ts("expiresAt").notNull(),
	createdAt: ts("createdAt"),
	updatedAt: ts("updatedAt")
});


// --- ADMIN & INTAKE TABLES ---
export const userProfiles = pgTable("user_profiles", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull().references(() => user.id),
  phone: text("phone"),
  preferredContactMethod: text("preferredContactMethod").default("EMAIL"),
  preferredLanguage: text("preferredLanguage").default("EN"),
  country: text("country"),
  region: text("region"),
  companyName: text("companyName"),
  createdAt: ts("createdAt").notNull(),
  updatedAt: ts("updatedAt").notNull(),
});

export const caseDrafts = pgTable("case_drafts", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull().references(() => user.id),
  status: text("status").notNull().default("DRAFT"), // "DRAFT" | "READY_FOR_REVIEW" | "SUBMITTED"
  matterTypeInferred: text("matterTypeInferred"),
  readinessScore: integer("readinessScore").default(0),
  expiresAt: ts("expiresAt"),
  createdAt: ts("createdAt").notNull(),
  updatedAt: ts("updatedAt").notNull(),
});

export const caseMessages = pgTable("case_messages", {
  id: text("id").primaryKey(),
  caseDraftId: text("caseDraftId").notNull().references(() => caseDrafts.id),
  role: text("role").notNull(), // "user" | "assistant"
  contentRedacted: text("contentRedacted").notNull(),
  sequenceNo: integer("sequenceNo").notNull(),
  createdAt: ts("createdAt").notNull(),
});

export const caseFiles = pgTable("case_files", {
  id: text("id").primaryKey(),
  caseDraftId: text("caseDraftId").notNull().references(() => caseDrafts.id),
  userId: text("userId").notNull().references(() => user.id),
  originalFilename: text("originalFilename").notNull(),
  mimeType: text("mimeType").notNull(),
  byteSize: integer("byteSize").notNull(),
  storageKey: text("storageKey").notNull(),
  uploadStatus: text("uploadStatus").default("PENDING"),
  createdAt: ts("createdAt").notNull(),
});

export const caseSubmissions = pgTable("case_submissions", {
  id: text("id").primaryKey(),
  caseDraftId: text("caseDraftId").notNull().references(() => caseDrafts.id),
  userId: text("userId").notNull().references(() => user.id),
  submissionReference: text("submissionReference").notNull(),
  finalStatus: text("finalStatus").notNull(), // "ROUTED" | "NEEDS_MORE_INFO" | "CLOSED"
  dossierPayloadBlob: text("dossierPayloadBlob"), // JSON stored as a string
  createdAt: ts("createdAt").notNull(),
});

export const caseRoutes = pgTable("case_routes", {
  id: text("id").primaryKey(),
  submissionId: text("submissionId").notNull().references(() => caseSubmissions.id),
  targetQueue: text("targetQueue").notNull(),
  confidence: text("confidence").notNull(), // "HIGH", "MEDIUM", "LOW"
  routeReason: text("routeReason"),
  createdAt: ts("createdAt").notNull(),
});

export const auditEvents = pgTable("audit_events", {
  id: text("id").primaryKey(),
  entityType: text("entityType").notNull(),
  entityId: text("entityId").notNull(),
  eventType: text("eventType").notNull(),
  eventPayloadRedacted: text("eventPayloadRedacted"),
  actorType: text("actorType").notNull(),
  actorIdOrSession: text("actorIdOrSession").notNull(),
  createdAt: ts("createdAt").notNull(),
});
