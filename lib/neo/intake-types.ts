export type IntakeState =
  | "DRAFT_DISCOVERY"
  | "DRAFT_CASE_BUILDING"
  | "PENDING_SUBMIT_CONFIRMATION"
  | "PENDING_EMAIL_VERIFICATION"
  | "VERIFIED_READY_FOR_FINAL_REVIEW"
  | "PENDING_FINAL_SUBMISSION"
  | "SUBMITTED_FOR_LEGAL_REVIEW"
  | "REVIEW_ACKNOWLEDGED"
  | "NEEDS_MORE_INFORMATION"
  | "ABANDONED"
  | "EXPIRED"
  | "REJECTED_SYSTEM"
  | "REJECTED_POLICY";

export interface IntakeDraft {
  id: string;
  session_id: string;
  status: IntakeState;
  language: string;
  matter_type_inferred?: string;
  matter_type_confirmed?: string;
  readiness_score: number;
  created_at: string;
  updated_at: string;
  expires_at: string;
}

export interface IntakeMessage {
  id: string;
  intake_draft_id: string;
  role: "user" | "assistant";
  content_redacted: string;
  content_full_storage_policy?: string;
  timestamp: string;
  sequence_no: number;
  /** How the user composed this message. Voice = dictated via the mic. */
  via?: "voice" | "keyboard";
}

export interface IntakeFile {
  id: string;
  intake_draft_id: string;
  temp_file_id: string;
  original_filename: string;
  mime_type: string;
  byte_size: number;
  sha256?: string;
  storage_status: string;
  extraction_status: string;
  malware_status: string;
  created_at: string;
}

export type VerificationMode = "DEMO_VERIFICATION" | "TEST_PIN_VERIFICATION" | "LIVE_OTP_VERIFICATION";

export interface VerificationSession {
  id: string;
  intake_draft_id: string;
  email_hash: string;
  email_normalized: string; // Stored for display/communication during routing
  verification_mode: VerificationMode;
  otp_hash?: string;
  attempt_count: number;
  resend_count: number;
  expires_at: string;
  verified_at?: string;
  status: "PENDING" | "VERIFIED" | "EXPIRED" | "FAILED";
}

export interface IntakeSubmission {
  id: string;
  intake_draft_id: string;
  submission_reference: string;
  dossier_version: number;
  submitted_at: string;
  submitted_by_session: string;
  verification_status: "VERIFIED" | "UNVERIFIED";
  consent_version: string;
  final_status: string;
}

export interface IntakeRouting {
  id: string;
  submission_id: string;
  route_target: string;
  route_reason: string;
  route_confidence: "HIGH" | "MEDIUM" | "LOW";
  manual_review_required: boolean;
  assigned_queue: string;
  assigned_at: string;
}

export interface IntakeAuditEvent {
  id: string;
  entity_type: string;
  entity_id: string;
  event_type: string;
  event_payload_redacted: string;
  actor_type: string;
  actor_id_or_session: string;
  created_at: string;
}
