import { sqliteTable, text, integer, blob } from "drizzle-orm/sqlite-core";

// --- BETTER AUTH REQUIRED TABLES ---
export const user = sqliteTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: integer("emailVerified", { mode: "boolean" }).notNull(),
	image: text("image"),
	createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
	updatedAt: integer("createdAt", { mode: "timestamp" }).notNull(),
});

export const session = sqliteTable("session", {
	id: text("id").primaryKey(),
	expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
	token: text("token").notNull().unique(),
	createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
	updatedAt: integer("createdAt", { mode: "timestamp" }).notNull(),
	ipAddress: text("ipAddress"),
	userAgent: text("userAgent"),
	userId: text("userId").notNull().references(() => user.id)
});

export const account = sqliteTable("account", {
	id: text("id").primaryKey(),
	accountId: text("accountId").notNull(),
	providerId: text("providerId").notNull(),
	userId: text("userId").notNull().references(() => user.id),
	accessToken: text("accessToken"),
	refreshToken: text("refreshToken"),
	idToken: text("idToken"),
	accessTokenExpiresAt: integer("accessTokenExpiresAt", { mode: "timestamp" }),
	refreshTokenExpiresAt: integer("refreshTokenExpiresAt", { mode: "timestamp" }),
	scope: text("scope"),
	password: text("password"),
	createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
	updatedAt: integer("createdAt", { mode: "timestamp" }).notNull()
});

export const verification = sqliteTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
	createdAt: integer("createdAt", { mode: "timestamp" }),
	updatedAt: integer("createdAt", { mode: "timestamp" })
});


// --- ADMIN & INTAKE TABLES ---
export const userProfiles = sqliteTable("user_profiles", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull().references(() => user.id),
  phone: text("phone"),
  preferredContactMethod: text("preferredContactMethod").default("EMAIL"),
  preferredLanguage: text("preferredLanguage").default("EN"),
  country: text("country"),
  region: text("region"),
  companyName: text("companyName"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export const caseDrafts = sqliteTable("case_drafts", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull().references(() => user.id),
  status: text("status").notNull().default("DRAFT"), // "DRAFT" | "READY_FOR_REVIEW" | "SUBMITTED"
  matterTypeInferred: text("matterTypeInferred"),
  readinessScore: integer("readinessScore").default(0),
  expiresAt: integer("expiresAt", { mode: "timestamp" }),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export const caseMessages = sqliteTable("case_messages", {
  id: text("id").primaryKey(),
  caseDraftId: text("caseDraftId").notNull().references(() => caseDrafts.id),
  role: text("role").notNull(), // "user" | "assistant"
  contentRedacted: text("contentRedacted").notNull(),
  sequenceNo: integer("sequenceNo").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
});

export const caseFiles = sqliteTable("case_files", {
  id: text("id").primaryKey(),
  caseDraftId: text("caseDraftId").notNull().references(() => caseDrafts.id),
  userId: text("userId").notNull().references(() => user.id),
  originalFilename: text("originalFilename").notNull(),
  mimeType: text("mimeType").notNull(),
  byteSize: integer("byteSize").notNull(),
  storageKey: text("storageKey").notNull(),
  uploadStatus: text("uploadStatus").default("PENDING"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
});

export const caseSubmissions = sqliteTable("case_submissions", {
  id: text("id").primaryKey(),
  caseDraftId: text("caseDraftId").notNull().references(() => caseDrafts.id),
  userId: text("userId").notNull().references(() => user.id),
  submissionReference: text("submissionReference").notNull(),
  finalStatus: text("finalStatus").notNull(), // "ROUTED" | "NEEDS_MORE_INFO" | "CLOSED"
  dossierPayloadBlob: blob("dossierPayloadBlob"), // JSON stored as buffer or string
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
});

export const caseRoutes = sqliteTable("case_routes", {
  id: text("id").primaryKey(),
  submissionId: text("submissionId").notNull().references(() => caseSubmissions.id),
  targetQueue: text("targetQueue").notNull(),
  confidence: text("confidence").notNull(), // "HIGH", "MEDIUM", "LOW"
  routeReason: text("routeReason"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
});

export const auditEvents = sqliteTable("audit_events", {
  id: text("id").primaryKey(),
  entityType: text("entityType").notNull(),
  entityId: text("entityId").notNull(),
  eventType: text("eventType").notNull(),
  eventPayloadRedacted: text("eventPayloadRedacted"),
  actorType: text("actorType").notNull(),
  actorIdOrSession: text("actorIdOrSession").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
});
