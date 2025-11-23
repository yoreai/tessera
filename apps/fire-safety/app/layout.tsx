import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "US Fire Safety Analytics Dashboard",
  description: "Interactive analytics platform for emergency fire safety data and AI-approved alarm systems",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

