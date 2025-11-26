import type { Metadata } from "next";
import "./globals.css";
import "katex/dist/katex.min.css";
import { ThemeProvider } from "./utils/theme-context";

export const metadata: Metadata = {
  title: "ARESA - Autonomous Research Engineering & Synthesis Architecture",
  description: "Building self-improving AI systems that advance STEM research autonomously. Empirically validated publications, proofs, and engineering solutions.",
  keywords: ["autonomous research", "AI systems", "machine learning", "self-improving AI", "STEM research", "publications", "spatial intelligence"],
};

// Script to prevent theme flash - runs before page renders
const themeScript = `
  (function() {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (saved === 'dark' || (!saved && prefersDark)) {
      document.documentElement.classList.add('dark');
    }
  })();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
