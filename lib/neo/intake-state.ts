import { IntakeState } from './intake-types';

/**
 * Markov transition function for the intake flow.
 * Maps from current state + context signals to next deterministic state.
 */
export interface IntakeTransitionContext {
  currentState: IntakeState;
  messageCount: number;
  hasFiles: boolean;
  hasEmail: boolean;
  hasConsent: boolean;
  intentClear: boolean;
}

export const executeMarkovTransition = (ctx: IntakeTransitionContext): IntakeState => {
  switch (ctx.currentState) {
    case 'DRAFT_DISCOVERY':
      if (ctx.messageCount >= 2 || ctx.hasFiles) return 'DRAFT_CASE_BUILDING';
      return 'DRAFT_DISCOVERY';

    case 'DRAFT_CASE_BUILDING':
      if (ctx.intentClear && ctx.messageCount >= 4) return 'PENDING_SUBMIT_CONFIRMATION';
      return 'DRAFT_CASE_BUILDING';

    case 'PENDING_SUBMIT_CONFIRMATION':
      return 'PENDING_EMAIL_VERIFICATION';

    case 'PENDING_EMAIL_VERIFICATION':
      if (ctx.hasEmail) return 'VERIFIED_READY_FOR_FINAL_REVIEW';
      return 'PENDING_EMAIL_VERIFICATION';

    case 'VERIFIED_READY_FOR_FINAL_REVIEW':
      if (ctx.hasConsent) return 'PENDING_FINAL_SUBMISSION';
      return 'VERIFIED_READY_FOR_FINAL_REVIEW';

    case 'PENDING_FINAL_SUBMISSION':
      return 'SUBMITTED_FOR_LEGAL_REVIEW';

    case 'SUBMITTED_FOR_LEGAL_REVIEW':
      return 'REVIEW_ACKNOWLEDGED';

    default:
      return 'DRAFT_DISCOVERY';
  }
};

/**
 * Readiness score calculator with real weighted metrics.
 * Returns a score from 0-5 representing how complete the intake context is.
 */
export interface ReadinessMetrics {
  hasIssue: boolean;
  hasTimeline: boolean;
  hasNamedParty: boolean;
  hasLocation: boolean;
  fileCount: number;
  explicitRequest: boolean;
}

export const calculateReadiness = (metrics: ReadinessMetrics): number => {
  let score = 0;
  if (metrics.hasIssue) score += 1;
  if (metrics.hasTimeline) score += 1;
  if (metrics.hasNamedParty) score += 1;
  if (metrics.hasLocation) score += 0.5;
  if (metrics.fileCount > 0) score += Math.min(metrics.fileCount, 2) * 0.5;
  if (metrics.explicitRequest) score += 0.5;
  return Math.round(score * 10) / 10;
};

/**
 * Metacognitive self-check for Neo.
 * Evaluates the current conversation state and returns improvement signals.
 */
export interface MetacognitiveReport {
  currentPhase: string;
  knownFacts: number;
  missingCritical: string[];
  uncertaintyLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  repeatedQuestionRisk: boolean;
  nextBestAction: string;
  summaryCompleteness: number; // 0-100
}

export function evaluateMetacognition(
  state: IntakeState,
  messages: { role: string; content_redacted: string }[],
  files: string[]
): MetacognitiveReport {
  const userMessages = messages.filter(m => m.role === 'user');
  const allText = userMessages.map(m => m.content_redacted).join(' ').toLowerCase();

  const hasTimeline = /\b(ago|last|year|month|week|day|date|when|since|before|after)\b/.test(allText);
  const hasParty = /\b(company|person|employer|landlord|tenant|spouse|partner|bank|insurance|government)\b/.test(allText);
  const hasLocation = /\b(antwerp|belgium|brussels|ghent|flanders|court|office)\b/.test(allText);
  const hasAmount = /\b(\d+[\.,]?\d*\s*(euro|eur|€|usd|\$)|\d{3,})\b/.test(allText);

  const knownFacts = [hasTimeline, hasParty, hasLocation, hasAmount, files.length > 0]
    .filter(Boolean).length;

  const missingCritical: string[] = [];
  if (!hasTimeline) missingCritical.push('Timeline or dates of events');
  if (!hasParty) missingCritical.push('Parties involved');
  if (userMessages.length < 2) missingCritical.push('Core problem description');

  // Detect repeated question patterns
  const lastTwoUser = userMessages.slice(-2).map(m => m.content_redacted.toLowerCase());
  const repeatedQuestionRisk = lastTwoUser.length === 2 &&
    lastTwoUser[0].substring(0, 20) === lastTwoUser[1].substring(0, 20);

  const uncertaintyLevel: 'LOW' | 'MEDIUM' | 'HIGH' =
    knownFacts >= 4 ? 'LOW' : knownFacts >= 2 ? 'MEDIUM' : 'HIGH';

  let nextBestAction: string;
  if (state === 'DRAFT_DISCOVERY') {
    nextBestAction = 'Ask the client to describe the core problem in their own words.';
  } else if (missingCritical.length > 0) {
    nextBestAction = `Clarify: ${missingCritical[0]}`;
  } else if (files.length === 0) {
    nextBestAction = 'Invite the client to attach supporting documents if available.';
  } else {
    nextBestAction = 'Proceed to intake summary and verification.';
  }

  const summaryCompleteness = Math.min(100, Math.round((knownFacts / 5) * 100));

  return {
    currentPhase: state,
    knownFacts,
    missingCritical,
    uncertaintyLevel,
    repeatedQuestionRisk,
    nextBestAction,
    summaryCompleteness
  };
}
