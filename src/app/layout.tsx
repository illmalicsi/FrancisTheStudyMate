import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "../../genkit.config"; // ensure Genkit plugins are registered at startup
import "../index"; // initialize Genkit runtime and flows on server startup

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Francis the StudyMate",
  description: "Your friendly study plan generator.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 z-50 rounded bg-brand-600 px-3 py-2 text-brand-foreground"
        >
          Skip to content
        </a>
        {/* header removed per request */}
        <main
          id="main-content"
          className="mx-auto max-w-3xl w-full px-6 sm:px-8 py-8"
        >
          {children}
        </main>
        <footer className="mx-auto max-w-5xl px-4 sm:px-6 py-8 text-xs text-brand-50/70">
          <p>© {new Date().getFullYear()} Francis the StudyMate.</p>
        </footer>
      </body>
    </html>
  );
}
