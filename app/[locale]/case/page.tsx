import type { Metadata } from "next";
import { NeoWorkspace } from "@/components/neo/neo-workspace";

export const metadata: Metadata = {
  title: "Case Room — NEO",
  description:
    "Prepare your matter for a lawyer at Orechdin. NEO walks you through it step by step and assembles a complete dossier you can submit when ready.",
  robots: { index: false, follow: false },
};

export default function CaseRoomPage() {
  return (
    <main id="main-content" className="bg-orech-slate">
      <NeoWorkspace />
    </main>
  );
}
