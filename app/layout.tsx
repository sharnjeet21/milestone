import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";

import { Navbar } from "@/components/Navbar";
import PageTransition from "@/components/PageTransition";
import { ToastProvider } from "@/context/ToastContext";

import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "MilestoneAI",
  description: "Milestone-based project management powered by AI.",
};

const themeScript = `
  try {
    const root = document.documentElement;
    const storedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldUseDark = storedTheme === "dark" || (!storedTheme && prefersDark);

    root.classList.toggle("dark", shouldUseDark);
  } catch (error) {
    console.error("Failed to initialize theme", error);
  }
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeScript}
        </Script>
        <ToastProvider>
          <div className="flex min-h-screen flex-col bg-background text-foreground">
            <Navbar />
            <div className="flex-1">
              <PageTransition>{children}</PageTransition>
            </div>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
