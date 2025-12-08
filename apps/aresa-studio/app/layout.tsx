import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import Sidebar from "@/components/Sidebar";
import DemoBanner from "@/components/DemoBanner";

export const metadata: Metadata = {
  title: "ARESA Studio - Universal Database Management",
  description: "Beautiful web UI for ARESA CLI - query PostgreSQL, MySQL, BigQuery, SQLite, ClickHouse, Snowflake, Databricks from your browser",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/icon.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ARESA Studio',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="flex flex-col h-screen">
            <DemoBanner />
            <div className="flex flex-1 overflow-hidden">
              <Sidebar />
              {/* Main Content */}
              <div className="flex-1 overflow-auto">
                {children}
              </div>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
