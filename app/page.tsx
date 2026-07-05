import React from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  BookOpen,
  ArrowRight,
  Layers,
  ChevronRight,
  Share2,
  Feather,
  Search,
  Pin,
  Star,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const session = await getServerSession(authOptions);
  const isAuthenticated = !!session;

  return (
    <div className="min-h-screen bg-zinc-950 font-sans text-zinc-50 relative overflow-hidden select-none">
      {/* Background gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(120,119,198,0.2),rgba(0,0,0,0))] pointer-events-none" />

      {/* Top Navbar */}
      <header className="sticky top-0 z-50 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2 text-white font-bold text-base tracking-tight hover:opacity-90"
            >
              <BookOpen className="h-5 w-5 text-zinc-100" />
              <span>Open Note</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <ButtonSecondary>
                  Go to Dashboard
                  <ArrowRight className="h-3.5 w-3.5" />
                </ButtonSecondary>
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/signin"
                  className="text-sm font-medium text-zinc-400 hover:text-zinc-200 px-3 py-2 transition-colors"
                >
                  Log in
                </Link>
                <Link href="/auth/signin">
                  <ButtonPrimary>Try Open Note</ButtonPrimary>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-20 pb-32 relative z-10 flex flex-col items-center text-center">
        {/* Eyebrow badge */}
        {/* <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-semibold tracking-wider uppercase text-zinc-400 mb-6">
          <BookOpen className="h-3.5 w-3.5 text-purple-400" />
          General Availability Release
        </div> */}

        {/* Title */}
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white max-w-3xl leading-[1.1] mb-6 font-sans">
          The collaborative workspace for all your ideas
        </h1>

        {/* Subtitle */}
        <p className="text-zinc-400 text-base sm:text-lg max-w-xl leading-relaxed mb-8">
          A modern, distraction-free environment to draft notes, brainstorm
          concepts, and build a synchronized team knowledge base.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mb-16">
          <Link href={isAuthenticated ? "/dashboard" : "/auth/signin"}>
            <button className="h-11 px-6 rounded-full bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-200 transition-all duration-200 flex items-center gap-2 shadow-lg">
              {isAuthenticated ? "Go to Dashboard" : "Start writing for free"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </Link>
          <a href="#features">
            <button className="h-11 px-6 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-semibold text-sm transition-all duration-200 flex items-center gap-1.5">
              Explore features
            </button>
          </a>
        </div>

        {/* App Mockup Preview (Improved Canvas matching the actual dashboard) */}
        <div className="w-full max-w-5xl rounded-2xl border border-zinc-800 bg-zinc-900/30 p-2.5 backdrop-blur-xl shadow-[0_0_50px_rgba(120,119,198,0.1)] mb-28">
          <div className="rounded-xl border border-zinc-800/80 bg-zinc-950 overflow-hidden shadow-2xl aspect-[1.7] flex flex-col">
            {/* Mock Header */}
            <div className="h-12 border-b border-zinc-900 bg-zinc-950 flex items-center justify-between px-4 shrink-0 text-left">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-zinc-900 border border-zinc-800 text-zinc-200">
                  <BookOpen className="h-3.5 w-3.5 text-zinc-300" />
                </div>
                <span className="text-xs text-white font-bold tracking-tight">
                  Open Note
                </span>
                <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-850 text-zinc-500 font-semibold">
                  Workspace
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-[10px] font-semibold text-zinc-300">
                    Alex Dev
                  </div>
                  <div className="text-[8px] text-zinc-500 uppercase">
                    Developer • team-alpha
                  </div>
                </div>
                <span className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700" />
              </div>
            </div>

            {/* Mock Dashboard Layout */}
            <div className="flex-1 flex overflow-hidden text-left text-xs text-zinc-400">
              {/* Mock Sidebar */}
              <div className="w-64 border-r border-zinc-900 bg-zinc-950/40 p-3 flex flex-col gap-3 shrink-0">
                {/* View Tabs */}
                <div className="flex bg-zinc-900 border border-zinc-850 rounded-lg p-0.5 w-full">
                  <div className="flex-1 text-center py-1 text-[10px] font-semibold rounded bg-zinc-800 text-white shadow-sm">
                    My Notes
                  </div>
                  <div className="flex-1 text-center py-1 text-[10px] font-medium text-zinc-500">
                    Knowledge Base
                  </div>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-zinc-650" />
                  <div className="pl-7 h-7 w-full bg-zinc-900 border border-zinc-850 rounded-lg flex items-center text-[10px] text-zinc-550">
                    Search notes, tags...
                  </div>
                </div>

                {/* Notes list items */}
                <div className="space-y-2 flex-1 overflow-hidden">
                  <div className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-900/50 space-y-1">
                    <div className="font-semibold text-white flex justify-between items-center text-[11px]">
                      <span>💡 Q3 Product Brainstorm</span>
                      <Pin className="h-3 w-3 text-zinc-450 fill-zinc-450" />
                    </div>
                    <p className="text-[10px] text-zinc-500 line-clamp-1">
                      Streamlining the editor workspace interface...
                    </p>
                    <div className="flex gap-1">
                      <span className="text-[8px] px-1 py-0.2 rounded border border-zinc-800 text-zinc-400">
                        General
                      </span>
                      <span className="text-[8px] px-1 py-0.2 rounded bg-zinc-900/40 text-zinc-500">
                        #ideas
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg border border-transparent hover:bg-zinc-900/20 space-y-1">
                    <div className="font-semibold text-zinc-350 text-[11px]">
                      📝 API Architecture Draft
                    </div>
                    <p className="text-[10px] text-zinc-550 line-clamp-1">
                      Documenting user auth routes and MongoDB schemas...
                    </p>
                    <div className="flex gap-1">
                      <span className="text-[8px] px-1 py-0.2 rounded border border-zinc-800 text-zinc-500">
                        Engineering
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mock Editor Workspace */}
              <div className="flex-1 bg-zinc-950 p-5 flex flex-col gap-3">
                {/* Editor Header */}
                <div className="flex items-center justify-between pb-2 border-b border-zinc-900 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <div className="flex bg-zinc-900 border border-zinc-800 rounded p-0.5">
                      <button className="px-2 py-0.5 text-[9px] rounded bg-zinc-800 text-white shadow">
                        Edit
                      </button>
                      <button className="px-2 py-0.5 text-[9px] text-zinc-550">
                        Preview
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-zinc-500">Category:</span>
                    <span className="text-[10px] px-2 py-0.5 border border-zinc-800 rounded bg-zinc-900 text-zinc-300">
                      General
                    </span>
                    <span className="text-[9px] text-zinc-500 ml-1">
                      Visibility:
                    </span>
                    <span className="text-[10px] px-2 py-0.5 border border-zinc-800 rounded bg-zinc-900 text-zinc-300">
                      Shared
                    </span>
                    <Star className="h-3.5 w-3.5 text-zinc-500" />
                  </div>
                </div>

                {/* Editor Body */}
                <div className="flex-1 flex flex-col gap-2 font-mono">
                  <div className="text-sm font-bold text-white mb-1">
                    Q3 Product Brainstorm
                  </div>
                  <div className="text-zinc-300 space-y-1.5 text-[11px] leading-relaxed">
                    <p># Q3 Product Brainstorm</p>
                    <p>
                      We need to focus on streamlining the workspace interface.
                      Let&apos;s outline the core features for the next release:
                    </p>
                    <p>- Clean editor with full Markdown rendering.</p>
                    <p>
                      - Collaborative Knowledge Base for company-wide sharing.
                    </p>
                    <p>
                      - Inline AI helpers to polish documents and suggest tags.
                    </p>
                  </div>
                </div>
              </div>

              {/* Mock AI Side Panel */}
              <div className="w-56 border-l border-zinc-900 bg-zinc-950 p-3 flex flex-col gap-3 shrink-0">
                <div className="flex items-center gap-1.5 pb-2 border-b border-zinc-900 text-[10px] font-bold text-zinc-200">
                  <Feather className="h-3.5 w-3.5 text-purple-400" />
                  AI Note Assistant
                </div>
                <div className="space-y-2 flex-1">
                  <div className="p-2 bg-zinc-900 border border-zinc-850 rounded-lg text-[9px] font-semibold text-zinc-350 hover:bg-zinc-800 cursor-pointer flex items-center gap-1.5">
                    <Feather className="h-3 w-3 text-emerald-400" /> Document
                    Polisher
                  </div>
                  <div className="p-2 bg-zinc-900 border border-zinc-850 rounded-lg text-[9px] font-semibold text-zinc-350 hover:bg-zinc-800 cursor-pointer flex items-center gap-1.5">
                    <Layers className="h-3 w-3 text-blue-400" /> Tag Recommender
                  </div>
                  <div className="p-2 border border-purple-900/30 bg-purple-950/5 rounded-lg space-y-1">
                    <div className="text-[8px] uppercase font-bold text-purple-400 tracking-wider">
                      AI Suggestions
                    </div>
                    <p className="text-[9px] text-purple-200">
                      Recommended Tags: [&quot;roadmap&quot;,
                      &quot;brainstorm&quot;, &quot;ideas&quot;]
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <section
          id="features"
          className="w-full border-t border-zinc-900 pt-24 space-y-16 text-left"
        >
          <div className="max-w-2xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Designed for real thinking, drafting, and knowledge keeping
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed">
              From quick thoughts to structured wikis, Open Note processes,
              structures, and synchronizes your work across your workspace
              automatically.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-900/10 hover:border-zinc-800 transition-all duration-200 space-y-4">
              <div className="h-10 w-10 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center justify-center">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-white text-base">
                Workspace Categories
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Organize thoughts using engineering, design, marketing, product,
                and personal folders, matching your daily brainstorming cycles.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-900/10 hover:border-zinc-800 transition-all duration-200 space-y-4">
              <div className="h-10 w-10 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center justify-center">
                <Share2 className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-white text-base">
                Knowledge Base Publishing
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Toggle notes to shared, instantly publishing them as read-only
                references across your entire team workspace.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-900/10 hover:border-zinc-800 transition-all duration-200 space-y-4">
              <div className="h-10 w-10 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center justify-center">
                <Feather className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-white text-base">
                Integrated AI Scribe
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Translate draft ideas, recommend tags, continue writing
                paragraphs, and generate summaries with one-click side panel
                integrations.
              </p>
            </div>
          </div>
        </section>

        {/* Call to Action Footer Card (Completely free of pricing) */}
        <section className="w-full max-w-5xl mt-24 p-8 sm:p-12 rounded-2xl border border-zinc-850 bg-zinc-900/20 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-6 text-left relative overflow-hidden shadow-2xl">
          <div className="space-y-2 relative z-10">
            <h3 className="text-xl sm:text-2xl font-bold text-white">
              Start drafting your workspace ideas today
            </h3>
            <p className="text-xs text-zinc-400 max-w-md">
              Experience a clean, distraction-free environment for all your
              drafting and collaborative note-taking with team-level
              organization.
            </p>
          </div>
          <Link
            href={isAuthenticated ? "/dashboard" : "/auth/signin"}
            className="relative z-10 shrink-0"
          >
            <button className="h-11 px-6 rounded-full bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-200 transition-all duration-200 flex items-center gap-1.5 shadow-lg">
              {isAuthenticated ? "Open Workspace" : "Get started"}
              <ChevronRight className="h-4 w-4" />
            </button>
          </Link>
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-8 relative z-10 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-600 gap-4">
          <span>&copy; 2026 Open Note Technologies. All rights reserved.</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-zinc-400 transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-zinc-400 transition-colors">
              Terms of Service
            </a>
            <a href="#" className="hover:text-zinc-400 transition-colors">
              Support
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ButtonPrimary({ children }: { children: React.ReactNode }) {
  return (
    <button className="h-9 px-4 rounded-full bg-white text-zinc-950 font-semibold text-xs hover:bg-zinc-200 transition-all duration-150 shadow flex items-center justify-center gap-1">
      {children}
    </button>
  );
}

function ButtonSecondary({ children }: { children: React.ReactNode }) {
  return (
    <button className="h-9 px-4 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-350 hover:text-zinc-100 hover:bg-zinc-800 font-semibold text-xs transition-all duration-150 flex items-center justify-center gap-1.5">
      {children}
    </button>
  );
}
