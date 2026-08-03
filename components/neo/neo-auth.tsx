"use client";

import { useState } from "react";
import { submitVerificationEmail, verifyOtpCode } from "@/server/actions/neo-submit-intake";
import { VerificationMode } from "@/lib/neo/intake-types";

export function NeoAuth({
  email,
  setEmail,
  onVerified,
  onCancel,
}: {
  email: string;
  setEmail: (val: string) => void;
  onVerified: () => void;
  onCancel: () => void;
}) {
  const [phase, setPhase] = useState<"COLLECT_EMAIL" | "VERIFY_CODE">("COLLECT_EMAIL");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<VerificationMode | null>(null);

  const handleSendCode = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await submitVerificationEmail(email);
      setMode(res.verificationMode);
      setPhase("VERIFY_CODE");
    } catch {
      setError("Failed to dispatch code.");
    }
    setLoading(false);
  };

  const handleVerify = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await verifyOtpCode(email, otp);
      if (res.success) {
        onVerified();
      } else {
        setError(res.message);
      }
    } catch {
      setError("Verification failed.");
    }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-[320px] mx-auto space-y-6 text-center">
      <div className="h-16 w-16 mx-auto bg-orech-bronze/10 rounded-full flex items-center justify-center border border-orech-bronze/30 relative">
        <svg className="w-8 h-8 text-orech-bronzeMuted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
      </div>

      {phase === "COLLECT_EMAIL" && (
        <>
          <div>
            <h3 className="text-xl font-light text-orech-ink">Contact Channel</h3>
            <p className="text-xs text-orech-mist mt-1">We use your email to verify a reliable contact channel for this intake.</p>
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            className="w-full text-center bg-orech-slate border border-orech-line rounded-lg px-4 py-3 text-sm outline-none focus:border-orech-bronze"
            disabled={loading}
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex flex-col gap-2">
             <button onClick={() => { if(email) handleSendCode(); }} disabled={loading} className="w-full bg-orech-bronze text-[#121212] font-semibold rounded-lg py-3 text-sm hover:opacity-90 transition shadow-md">
               {loading ? "Dispatching..." : "Send Verification Code"}
             </button>
             <button onClick={onCancel} className="text-xs text-orech-mist hover:text-orech-ink transition mt-1">Cancel Submission</button>
          </div>
        </>
      )}

      {phase === "VERIFY_CODE" && (
        <>
          <div>
            <h3 className="text-xl font-light text-orech-ink">Code Verification</h3>
            <p className="text-xs text-orech-mist mt-1">A secure code was dispatched to <strong>{email}</strong>.</p>
            {mode === "DEMO_VERIFICATION" && <span className="inline-block mt-2 px-2 py-0.5 bg-yellow-400/20 text-yellow-400 text-[9px] rounded uppercase font-bold tracking-wider border border-yellow-400/40">Demo Mode: Use Any Code</span>}
            {mode === "TEST_PIN_VERIFICATION" && <span className="inline-block mt-2 px-2 py-0.5 bg-blue-400/20 text-blue-400 text-[9px] rounded uppercase font-bold tracking-wider border border-blue-400/40">Test Mode: Use 0000</span>}
          </div>
          <div className="flex gap-2 justify-center">
            <input
              type="text"
              maxLength={4}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="0000"
              className="w-32 text-center text-xl tracking-widest font-mono bg-orech-slate border border-orech-line rounded-lg px-4 py-3 focus:border-orech-bronze outline-none text-orech-ink"
              disabled={loading}
            />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button onClick={() => { if(otp.length >= 4) handleVerify(); }} disabled={loading} className="w-full bg-orech-bronze text-[#121212] font-medium rounded-lg py-3 text-sm hover:opacity-90 transition shadow-md">
            {loading ? "Verifying..." : "Confirm Final Review"}
          </button>
          <button onClick={() => setPhase("COLLECT_EMAIL")} className="text-xs text-orech-mist hover:text-orech-ink transition">Use a different email</button>
        </>
      )}
    </div>
  );
}
