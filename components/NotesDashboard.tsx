"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { signOut } from "next-auth/react";
import { Session } from "next-auth";
import {
  Plus,
  Search,
  LogOut,
  FileText,
  BookOpen,
  Sun,
  Moon,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import NoteList, { NoteItem } from "./NoteList";
import NoteEditor from "./NoteEditor";
import NoteAISidebar from "./NoteAISidebar";

interface NotesDashboardProps {
  session: Session;
}

export default function NotesDashboard({ session }: NotesDashboardProps) {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [selectedNote, setSelectedNote] = useState<NoteItem | null>(null);
  const [tab, setTab] = useState<"my-notes" | "knowledge-base">("my-notes");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [sort, setSort] = useState<string>("newest");
  const [showFilters, setShowFilters] = useState(false);

  const [isAISidebarOpen, setIsAISidebarOpen] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [saving, setSaving] = useState(false);

  const [mobileActiveView, setMobileActiveView] = useState<"list" | "editor">(
    "list",
  );
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);

  // Refs to break dependency cycles in fetchNotes
  const selectedNoteIdRef = useRef<string | null>(null);
  const skipAutoSelectRef = useRef(false);

  const currentUser = session.user;
  const isGuest = currentUser.id === "user-guest";

  const [allGuestNotes, setAllGuestNotes] = useState<NoteItem[]>(() => {
    return [
      {
        _id: "guest-note-default",
        title: "Welcome to Open Note (Guest)",
        content: `# Volatile Guest Session\n\nThis note exists only in your browser tab's memory.\n\n⚠️ **Warning:** If you refresh this page, close this tab, or log out, **all your notes will be permanently deleted.**\n\nCreate an account to save notes permanently!`,
        category: "General",
        tags: ["guest", "temporary"],
        isPinned: true,
        isStarred: true,
        visibility: "private",
        authorName: "Guest User",
        authorId: "user-guest",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  });

  useEffect(() => {
    Promise.resolve().then(() => {
      setMounted(true);
      const savedTheme = localStorage.getItem("theme") as
        | "light"
        | "dark"
        | null;
      if (savedTheme) {
        setTheme(savedTheme);
        document.documentElement.classList.toggle(
          "dark",
          savedTheme === "dark",
        );
      } else {
        const prefersDark = window.matchMedia(
          "(prefers-color-scheme: dark)",
        ).matches;
        setTheme(prefersDark ? "dark" : "light");
        document.documentElement.classList.toggle("dark", prefersDark);
      }
    });
  }, []);

  useEffect(() => {
    if (mounted) {
      document.documentElement.classList.toggle("dark", theme === "dark");
      localStorage.setItem("theme", theme);
    }
  }, [theme, mounted]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  // Keep ref in sync with state so fetchNotes can read it without being a dep
  useEffect(() => {
    selectedNoteIdRef.current = selectedNote?._id ?? null;
  }, [selectedNote?._id]);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchNotes = useCallback(async () => {
    if (isGuest) {
      setLoadingList(false);
      let filtered = [...allGuestNotes];
      if (tab === "knowledge-base")
        filtered = filtered.filter((n) => n.visibility === "shared");
      if (category && category !== "All")
        filtered = filtered.filter((n) => n.category === category);
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        filtered = filtered.filter(
          (n) =>
            n.title.toLowerCase().includes(q) ||
            n.content.toLowerCase().includes(q) ||
            n.tags.some((t: string) => t.toLowerCase().includes(q)),
        );
      }
      filtered.sort((a, b) => {
        if (sort === "oldest")
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        if (sort === "alphabetical") return a.title.localeCompare(b.title);
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
      setNotes(filtered);
      // Don't override selection if note creation just happened
      if (!skipAutoSelectRef.current) {
        if (filtered.length > 0) {
          const still = filtered.find((n) => n._id === selectedNoteIdRef.current);
          setSelectedNote(still ?? filtered[0]);
        } else {
          setSelectedNote(null);
        }
      }
      skipAutoSelectRef.current = false;
      return;
    }

    Promise.resolve().then(() => setLoadingList(true));
    try {
      const queryParams = new URLSearchParams({
        type: tab,
        q: debouncedSearch,
        category,
        sort,
      });
      const res = await fetch(`/api/notes?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
        // Don't override selection if note creation just happened
        if (!skipAutoSelectRef.current) {
          if (data.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const still = data.find((n: any) => n._id === selectedNoteIdRef.current);
            setSelectedNote(still ?? data[0]);
          } else {
            setSelectedNote(null);
          }
        }
        skipAutoSelectRef.current = false;
      }
    } catch (err) {
      console.error("Error fetching notes:", err);
    } finally {
      setLoadingList(false);
    }
  }, [
    tab,
    debouncedSearch,
    category,
    sort,
    isGuest,
    allGuestNotes,
  ]);

  useEffect(() => {
    Promise.resolve().then(() => fetchNotes());
  }, [fetchNotes]);

  const handleCreateNewNote = async () => {
    setSearch("");
    setDebouncedSearch("");
    setCategory("All");
    setTab("my-notes");

    if (isGuest) {
      const newNote: NoteItem = {
        _id: "guest-note-" + Math.random().toString(36).substring(2, 11),
        title: "Untitled Note",
        content: "Start writing...",
        category: "General",
        tags: [],
        visibility: "private",
        isPinned: false,
        isStarred: false,
        authorName: "Guest User",
        authorId: "user-guest",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      skipAutoSelectRef.current = true;
      setAllGuestNotes((prev) => [newNote, ...prev]);
      selectedNoteIdRef.current = newNote._id;
      setSelectedNote(newNote);
      setMobileActiveView("editor");
      return;
    }

    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Untitled Note",
          content: "Start writing...",
          category: "General",
          tags: [],
          visibility: "private",
        }),
      });
      if (res.ok) {
        const newNote = await res.json();
        // Mark that the next fetchNotes call must not override this selection
        skipAutoSelectRef.current = true;
        selectedNoteIdRef.current = newNote._id;
        setNotes((prev) => [newNote, ...prev]);
        setSelectedNote(newNote);
        setMobileActiveView("editor");
        setTab("my-notes");
      }
    } catch (err) {
      console.error("Error creating note:", err);
    }
  };

  const handleSaveNote = async (updatedFields: Partial<NoteItem>) => {
    if (!selectedNote) return;
    setSaving(true);
    if (isGuest) {
      const updatedNote = {
        ...selectedNote,
        ...updatedFields,
        updatedAt: new Date().toISOString(),
      };
      setAllGuestNotes((prev) =>
        prev.map((n) => (n._id === selectedNote._id ? updatedNote : n)),
      );
      setSelectedNote(updatedNote);
      setSaving(false);
      return;
    }
    try {
      const res = await fetch(`/api/notes/${selectedNote._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFields),
      });
      if (res.ok) {
        const updated = await res.json();
        setSelectedNote(updated);
        setNotes((prev) =>
          prev.map((n) => (n._id === updated._id ? updated : n)),
        );
      }
    } catch (err) {
      console.error("Error saving note:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (isGuest) {
      setAllGuestNotes((prev) => prev.filter((n) => n._id !== noteId));
      if (selectedNote?._id === noteId) setSelectedNote(null);
      setMobileActiveView("list");
      return;
    }
    try {
      const res = await fetch(`/api/notes/${noteId}`, { method: "DELETE" });
      if (res.ok) {
        setNotes((prev) => prev.filter((n) => n._id !== noteId));
        setSelectedNote(null);
        setMobileActiveView("list");
      }
    } catch (err) {
      console.error("Error deleting note:", err);
    }
  };

  const handleApplyTags = async (aiTags: string[]) => {
    if (!selectedNote) return;
    const mergedTags = Array.from(new Set([...selectedNote.tags, ...aiTags]));
    await handleSaveNote({ tags: mergedTags });
  };

  const handleAppendContent = async (text: string) => {
    if (!selectedNote) return;
    await handleSaveNote({ content: `${selectedNote.content}${text}` });
  };

  const handleReplaceContent = async (newText: string) => {
    if (!selectedNote) return;
    await handleSaveNote({ content: newText });
  };

  const noteCount = notes.length;

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 select-none transition-colors duration-200">
      {/* ── Top navigation bar ── */}
      <header className="h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center justify-between px-5 shrink-0 z-10 transition-colors duration-200">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-900 dark:bg-white text-white dark:text-zinc-950">
            <BookOpen className="h-4 w-4" />
          </div>
          <span className="font-semibold text-sm text-zinc-900 dark:text-white tracking-tight">
            Open Note
          </span>
          <span className="hidden sm:block h-4 w-px bg-zinc-200 dark:bg-zinc-800" />
          <span className="hidden sm:block text-[11px] text-zinc-400 dark:text-zinc-500">
            {tab === "knowledge-base" ? "Knowledge Base" : "My Notes"}
          </span>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-1">
          {/* User info */}
          <div className="hidden sm:flex flex-col items-end mr-2">
            <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 leading-tight">
              {currentUser.name}
            </span>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {isGuest ? "Guest" : currentUser.role}
            </span>
          </div>

          <Button
            variant="ghost"
            onClick={toggleTheme}
            className="h-8 w-8 p-0 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
            title="Toggle Theme"
          >
            {!mounted ? (
              <div className="h-4 w-4" />
            ) : theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          <Button
            variant="ghost"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="h-8 w-8 p-0 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* ── Guest warning strip ── */}
      {isGuest && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-400 px-5 py-2 flex items-center justify-between gap-3">
          <span className="text-[11px]">
            <strong className="font-semibold">Guest session —</strong> notes are
            not saved. They will be lost if you refresh or close this tab.
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/auth/signin?mode=signup" })}
            className="text-[11px] font-semibold underline underline-offset-2 text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 whitespace-nowrap transition-colors cursor-pointer"
          >
            Create account
          </button>
        </div>
      )}

      {/* ── Main body ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── Left sidebar: note browser ── */}
        <div
          className={`w-full md:w-80 border-r border-zinc-200 dark:border-zinc-800 flex flex-col bg-zinc-50 dark:bg-zinc-950 shrink-0 transition-colors duration-200 ${
            selectedNote && mobileActiveView === "editor"
              ? "hidden md:flex"
              : "flex"
          }`}
        >
          {/* Sidebar header */}
          <div className="px-4 pt-4 pb-3 border-b border-zinc-200 dark:border-zinc-800">
            {/* Tab switcher */}
            <div className="flex items-center gap-1 mb-3">
              <button
                type="button"
                onClick={() => setTab("my-notes")}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                  tab === "my-notes"
                    ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200 dark:border-zinc-700"
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
              >
                My Notes
              </button>
              <button
                type="button"
                onClick={() => setTab("knowledge-base")}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                  tab === "knowledge-base"
                    ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200 dark:border-zinc-700"
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
              >
                Knowledge Base
              </button>
            </div>

            {/* Search row */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
                <Input
                  placeholder="Search notes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8 bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-xs rounded-md text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 focus-visible:ring-0 focus:border-zinc-400 dark:focus:border-zinc-600"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowFilters((v) => !v)}
                className={`h-8 w-8 flex items-center justify-center rounded-md border text-zinc-500 transition-colors ${
                  showFilters
                    ? "bg-zinc-900 dark:bg-zinc-100 border-zinc-900 dark:border-zinc-100 text-white dark:text-zinc-900"
                    : "bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600"
                }`}
                title="Filters"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={handleCreateNewNote}
                className="h-8 w-8 flex items-center justify-center rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                title="New note"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Filter dropdowns */}
            {showFilters && (
              <div className="flex gap-2 mt-2">
                <Select
                  value={category}
                  onValueChange={(val) => {
                    if (val) setCategory(val);
                  }}
                >
                  <SelectTrigger className="h-7 bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-[10px] rounded-md text-zinc-600 dark:text-zinc-400 flex-1 gap-1">
                    <SelectValue placeholder="Category" />
                    <ChevronDown className="h-3 w-3 opacity-50 ml-auto" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-300 text-xs">
                    <SelectItem value="All">All Categories</SelectItem>
                    <SelectItem value="Engineering">Engineering</SelectItem>
                    <SelectItem value="Design">Design</SelectItem>
                    <SelectItem value="Product">Product</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Personal">Personal</SelectItem>
                    <SelectItem value="General">General</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={sort}
                  onValueChange={(val) => {
                    if (val) setSort(val);
                  }}
                >
                  <SelectTrigger className="h-7 bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-[10px] rounded-md text-zinc-600 dark:text-zinc-400 flex-1">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-300 text-xs">
                    <SelectItem value="newest">Newest first</SelectItem>
                    <SelectItem value="oldest">Oldest first</SelectItem>
                    <SelectItem value="alphabetical">Alphabetical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Note count label */}
          {!loadingList && (
            <div className="px-4 py-2 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-600">
                {noteCount} {noteCount === 1 ? "note" : "notes"}
              </span>
            </div>
          )}

          {/* Note list */}
          {loadingList ? (
            <div className="flex-1 flex flex-col gap-2 px-4 py-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-20 rounded-lg bg-zinc-100 dark:bg-zinc-900 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <NoteList
              notes={notes}
              selectedNoteId={selectedNote?._id}
              onSelectNote={(note) => {
                setSelectedNote(note);
                setMobileActiveView("editor");
              }}
              currentUserId={currentUser.id}
            />
          )}
        </div>

        {/* ── Right editor area ── */}
        <div
          className={`flex-1 flex flex-row overflow-hidden transition-colors duration-200 ${
            !selectedNote || mobileActiveView === "list"
              ? "hidden md:flex"
              : "flex"
          }`}
        >
          {selectedNote ? (
            <div className="flex-1 flex flex-row min-w-0 overflow-hidden">
              <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <NoteEditor
                  key={selectedNote._id}
                  note={selectedNote}
                  currentUserId={currentUser.id}
                  onSave={handleSaveNote}
                  onDelete={handleDeleteNote}
                  onOpenAISidebar={() => setIsAISidebarOpen(!isAISidebarOpen)}
                  isSaving={saving}
                  onBackToList={() => setMobileActiveView("list")}
                  isGuest={isGuest}
                />
              </div>
              <NoteAISidebar
                noteContent={selectedNote.content}
                isOpen={isAISidebarOpen}
                onClose={() => setIsAISidebarOpen(false)}
                onApplyTags={handleApplyTags}
                onAppendContent={handleAppendContent}
                onReplaceContent={handleReplaceContent}
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600 bg-white dark:bg-zinc-950 text-center p-8 select-none">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 mb-4">
                <FileText className="h-5 w-5 text-zinc-400 dark:text-zinc-600" />
              </div>
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                No note selected
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-1 max-w-[200px] leading-relaxed">
                Select a note from the sidebar or create a new one.
              </p>
              <button
                onClick={handleCreateNewNote}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                New note
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
