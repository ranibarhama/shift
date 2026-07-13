import type { Metadata } from "next";
import "@xyflow/react/dist/style.css";
import "./globals.css";
import { getCurrentTheme } from "@/lib/theme";
import ConfirmProvider from "@/components/ConfirmProvider";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Shift — B2C AI Implementation Playbook",
  description: "Map how we work today, define how we want to work tomorrow, and decide where AI fits.",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = await getCurrentTheme();
  return (
    <html lang="en" className={theme === "dark" ? "dark" : ""} style={{ colorScheme: theme }}>
      <body className="flex min-h-screen flex-col antialiased">
        <ConfirmProvider>
          <div className="flex flex-1 flex-col">{children}</div>
          <Footer />
        </ConfirmProvider>
      </body>
    </html>
  );
}
