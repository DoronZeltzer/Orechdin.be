"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Loader2, MailCheck } from "lucide-react";
import { useState } from "react";

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const resendVerification = async () => {
    setLoading(true);
    await authClient.sendVerificationEmail({
      email: email,
      callbackURL: "/neo",
    });
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="text-center">
      <div className="mx-auto w-12 h-12 rounded-full bg-orech-bronze/10 border border-orech-bronze/20 flex items-center justify-center mb-6">
        <MailCheck className="w-6 h-6 text-orech-bronze" />
      </div>
      <h3 className="text-xl font-medium text-orech-ink mb-3">Verify Communications Channel</h3>
      <p className="text-sm text-orech-mist mb-8">
        We rely on verifiable communication channels for all dossier updates. A verification link has been drafted for <span className="text-orech-ink font-medium">{email}</span>.
      </p>

      {sent ? (
        <p className="text-sm text-emerald-400 font-medium mb-6">Verification payload re-sent successfully.</p>
      ) : (
        <button
          onClick={resendVerification}
          disabled={loading || !email}
          className="w-full flex items-center justify-center py-2.5 px-4 mb-4 border border-orech-line rounded-lg shadow-sm text-sm font-medium text-orech-ink bg-orech-slate hover:bg-orech-slate/80 transition-colors"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Resend Payload"}
        </button>
      )}

      <div className="mt-4 text-center text-sm text-orech-mist">
        Once verified, you may <Link href="/sign-in" className="text-orech-bronze hover:text-white transition-colors">Access Workspace</Link>.
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="text-center p-8 text-orech-mist">Loading authorization protocols...</div>}>
      <VerifyEmailForm />
    </Suspense>
  );
}
