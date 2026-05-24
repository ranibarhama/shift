import type { Metadata } from "next";
import "@xyflow/react/dist/style.css";
import "./globals.css";
import { getCurrentTheme } from "@/lib/theme";

export const metadata: Metadata = {
  title: "Shift — B2C AI Implementation Playbook",
  description: "Map how we work today, define how we want to work tomorrow, and decide where AI fits.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = await getCurrentTheme();
  return (
    <html lang="en" className={theme === "dark" ? "dark" : ""} style={{ colorScheme: theme }}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
