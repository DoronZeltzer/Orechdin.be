"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import {
  X,
  Mail,
  Send,
  Share2,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  MessageCircle,
  Globe,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DeliveryChannel =
  | "gmail"
  | "outlook"
  | "whatsapp"
  | "linkedin"
  | "copy"
  | "native-share";

export interface DeliveryPayload {
  /** Pre-rendered Markdown text for the case-file body. */
  markdownBody: string;
  /** Human-readable subject line. */
  subject: string;
  /** Firm's intake email address (pre-filled as recipient). */
  recipientEmail: string;
  /** Matter reference id. */
  reference: string;
  /** Download URLs (optional - appended to body). */
  pdfUrl?: string;
  docxUrl?: string;
}

interface DeliveryChannelModalProps {
  open: boolean;
  onClose: () => void;
  payload: DeliveryPayload;
  /** Called *after* the user picks a channel and the action completes. */
  onDelivered: (channel: DeliveryChannel) => void;
}

// ---------------------------------------------------------------------------
// Channel metadata
// ---------------------------------------------------------------------------

const CHANNELS: {
  id: DeliveryChannel;
  icon: React.ElementType;
  color: string;
  hoverBg: string;
  borderColor: string;
}[] = [
  {
    id: "gmail",
    icon: Mail,
    color: "text-red-400",
    hoverBg: "hover:bg-red-500/10",
    borderColor: "border-red-500/20",
  },
  {
    id: "outlook",
    icon: Mail,
    color: "text-blue-400",
    hoverBg: "hover:bg-blue-500/10",
    borderColor: "border-blue-500/20",
  },
  {
    id: "whatsapp",
    icon: MessageCircle,
    color: "text-green-400",
    hoverBg: "hover:bg-green-500/10",
    borderColor: "border-green-500/20",
  },
  {
    id: "linkedin",
    icon: Globe,
    color: "text-sky-400",
    hoverBg: "hover:bg-sky-500/10",
    borderColor: "border-sky-500/20",
  },
  {
    id: "copy",
    icon: Copy,
    color: "text-orech-bronze",
    hoverBg: "hover:bg-orech-bronze/10",
    borderColor: "border-orech-bronze/20",
  },
];

// Native share is appended conditionally when the API is available.

// ---------------------------------------------------------------------------
// Helpers - build external URLs
// ---------------------------------------------------------------------------

function truncateForUrl(text: string, maxLen = 1800): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + "\n\n[…truncated - full report attached as PDF/Word]";
}

function buildGmailUrl(payload: DeliveryPayload): string {
  const body = truncateForUrl(composeBody(payload));
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(payload.recipientEmail)}&su=${encodeURIComponent(payload.subject)}&body=${encodeURIComponent(body)}`;
}

function buildOutlookUrl(payload: DeliveryPayload): string {
  const body = truncateForUrl(composeBody(payload));
  return `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(payload.recipientEmail)}&subject=${encodeURIComponent(payload.subject)}&body=${encodeURIComponent(body)}`;
}

function buildWhatsAppUrl(payload: DeliveryPayload): string {
  const text = `*${payload.subject}*\n\n${truncateForUrl(composeBody(payload), 1200)}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

function buildLinkedInUrl(payload: DeliveryPayload): string {
  // LinkedIn share only supports URL sharing; we share the office URL with context.
  const summary = `${payload.subject}\n\nRef: ${payload.reference}`;
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent("https://www.orechdin.be")}&summary=${encodeURIComponent(summary)}`;
}

function composeBody(payload: DeliveryPayload): string {
  const lines: string[] = [];
  lines.push(`Case File Reference: ${payload.reference}`);
  lines.push("");
  lines.push(payload.markdownBody);
  if (payload.pdfUrl || payload.docxUrl) {
    lines.push("");
    lines.push("--- Attachments ---");
    if (payload.pdfUrl) lines.push(`PDF: ${payload.pdfUrl}`);
    if (payload.docxUrl) lines.push(`DOCX: ${payload.docxUrl}`);
  }
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DeliveryChannelModal({
  open,
  onClose,
  payload,
  onDelivered,
}: DeliveryChannelModalProps) {
  const t = useTranslations("NeoCaseFile");
  const [copied, setCopied] = useState(false);
  const [hasNativeShare, setHasNativeShare] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Detect native share API (mobile)
  useEffect(() => {
    setHasNativeShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Click-outside backdrop
  const onBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlayRef.current) onClose();
    },
    [onClose],
  );

  const handleChannel = useCallback(
    async (channel: DeliveryChannel) => {
      switch (channel) {
        case "gmail":
          window.open(buildGmailUrl(payload), "_blank", "noopener");
          break;
        case "outlook":
          window.open(buildOutlookUrl(payload), "_blank", "noopener");
          break;
        case "whatsapp":
          window.open(buildWhatsAppUrl(payload), "_blank", "noopener");
          break;
        case "linkedin":
          window.open(buildLinkedInUrl(payload), "_blank", "noopener");
          break;
        case "copy": {
          const full = composeBody(payload);
          try {
            await navigator.clipboard.writeText(full);
            setCopied(true);
            setTimeout(() => setCopied(false), 2200);
          } catch {
            /* fallback: noop */
          }
          break;
        }
        case "native-share": {
          try {
            await navigator.share({
              title: payload.subject,
              text: truncateForUrl(composeBody(payload), 1200),
            });
          } catch {
            /* cancelled */
          }
          break;
        }
      }
      onDelivered(channel);
    },
    [payload, onDelivered],
  );

  if (!open) return null;

  const channelsToShow = [...CHANNELS];
  if (hasNativeShare) {
    channelsToShow.push({
      id: "native-share",
      icon: Share2,
      color: "text-violet-400",
      hoverBg: "hover:bg-violet-500/10",
      borderColor: "border-violet-500/20",
    });
  }

  return (
    <div
      ref={overlayRef}
      onClick={onBackdropClick}
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={t("deliverTitle")}
    >
      {/* Glass panel */}
      <div className="relative mx-3 mb-3 w-full max-w-md overflow-hidden rounded-2xl border border-orech-line/60 bg-[#181818]/95 shadow-2xl shadow-black/50 sm:mb-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-orech-line/40 px-5 py-4">
          <div>
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-orech-bronze">
              {t("deliverEyebrow")}
            </p>
            <h2 className="mt-0.5 text-[0.92rem] font-semibold text-orech-ink">
              {t("deliverTitle")}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-orech-mist/70 transition hover:bg-orech-slate/40 hover:text-orech-ink"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Description */}
        <p className="px-5 pt-3 text-[0.72rem] leading-relaxed text-orech-mist">
          {t("deliverDesc")}
        </p>

        {/* Reference badge */}
        <div className="mx-5 mt-3 flex items-center gap-2 rounded-lg border border-orech-line/40 bg-orech-slate/30 px-3 py-2">
          <span className="font-mono text-[0.6rem] uppercase tracking-wider text-orech-mist/70">
            REF
          </span>
          <span className="font-mono text-[0.72rem] font-medium text-orech-bronze">
            {payload.reference}
          </span>
        </div>

        {/* Channel grid */}
        <div className="grid grid-cols-2 gap-2 p-5 sm:grid-cols-3">
          {channelsToShow.map((ch) => (
            <button
              key={ch.id}
              type="button"
              onClick={() => handleChannel(ch.id)}
              className={`group flex flex-col items-center gap-2 rounded-xl border ${ch.borderColor} bg-transparent px-3 py-4 transition-all duration-200 ${ch.hoverBg} hover:scale-[1.03] active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-orech-bronze`}
            >
              {ch.id === "copy" && copied ? (
                <Check className="h-6 w-6 text-emerald-400 transition" />
              ) : (
                <ch.icon
                  className={`h-6 w-6 ${ch.color} transition group-hover:scale-110`}
                />
              )}
              <span className="text-[0.68rem] font-medium text-orech-ink">
                {t(`channel_${ch.id}` as Parameters<typeof t>[0])}
              </span>
              {ch.id === "copy" && copied && (
                <span className="text-[0.58rem] text-emerald-400">
                  {t("channelCopied")}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Footer note */}
        <div className="border-t border-orech-line/30 px-5 py-3">
          <p className="text-[0.64rem] italic leading-relaxed text-orech-mist/60">
            {t("deliverFooter")}
          </p>
        </div>
      </div>
    </div>
  );
}
