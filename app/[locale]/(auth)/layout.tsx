import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-orech-paper flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-orech-bronze/30">
      <div className="absolute top-8 left-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-orech-mist hover:text-orech-ink transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Return to Hub
        </Link>
      </div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h2 className="text-3xl font-display font-light text-orech-ink mb-2">
          Client Workspace
        </h2>
        <p className="text-orech-mist font-mono text-xs uppercase tracking-widest">
          Orechdin Legal Enterprise
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-orech-slate/50 py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-orech-line backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orech-bronze/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
