"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const { data, error } = await authClient.signUp.email({
      email,
      password,
      name,
    });

    if (error) {
      setError(error.message || "Failed to initialize profile.");
      setLoading(false);
    } else {
      window.location.href = "/verify-email?email=" + encodeURIComponent(email);
    }
  };

  return (
    <div>
      <h3 className="text-xl font-medium text-orech-ink mb-6">Initialize Legal Profile</h3>
      
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-900/20 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSignUp} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-orech-mist mb-1.5">Full Legal Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-orech-paper border border-orech-line rounded-lg px-4 py-2.5 text-orech-ink focus:outline-none focus:border-orech-bronze transition-colors"
            placeholder="John Doe"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-orech-mist mb-1.5">Professional Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-orech-paper border border-orech-line rounded-lg px-4 py-2.5 text-orech-ink focus:outline-none focus:border-orech-bronze transition-colors"
            placeholder="client@enterprise.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-orech-mist mb-1.5">Secure Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-orech-paper border border-orech-line rounded-lg px-4 py-2.5 text-orech-ink focus:outline-none focus:border-orech-bronze transition-colors"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-4 flex items-center justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-orech-bronze hover:bg-orech-bronzeMuted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orech-bronze disabled:opacity-50 transition-colors"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Identity"}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-orech-mist">
        Already have a pending dossier?{" "}
        <Link href="/sign-in" className="text-orech-bronze hover:text-white transition-colors">
          Access Workspace
        </Link>
      </div>
    </div>
  );
}
