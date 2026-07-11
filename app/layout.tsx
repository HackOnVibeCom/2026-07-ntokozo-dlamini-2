import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SwarmLaunch — Multi-Agent Launch Orchestrator",
  description:
    "A fully offline-capable multi-agent system that plans, writes, designs, and projects a launch campaign for a newly launched mobile app.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" style={{ colorScheme: "light" }}>
      <body className="min-h-screen antialiased bg-white text-zinc-900">{children}</body>
    </html>
  );
}
