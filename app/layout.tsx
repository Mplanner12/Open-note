import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";
import Script from "next/script";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Open Note — Collaborative Workspace",
    template: "%s · Open Note",
  },
  description:
    "A modern, distraction-free workspace for drafting notes, brainstorming ideas, and building a synchronized team knowledge base. Powered by AI.",
  keywords: [
    "note taking",
    "collaborative workspace",
    "knowledge base",
    "AI writing assistant",
    "markdown editor",
    "team notes",
    "Open Note",
  ],
  authors: [{ name: "Open Note" }],
  creator: "Open Note",
  metadataBase: new URL("https://open-note.app"),
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://open-note.app",
    siteName: "Open Note",
    title: "Open Note — Collaborative Workspace",
    description:
      "Draft, organize, and share notes with your team. AI-powered suggestions, inline autocomplete, and a clean distraction-free editor.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Open Note — Collaborative Workspace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Open Note — Collaborative Workspace",
    description:
      "Draft, organize, and share notes with your team. AI-powered inline suggestions and a distraction-free editor.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <Script
          id="theme-loader"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var savedTheme = localStorage.getItem('theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors duration-200">
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
