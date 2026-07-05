"use client";

import React, { useState, useEffect, useRef } from "react";
import { NoteItem } from "./NoteList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pin,
  Star,
  Lock,
  Unlock,
  Save,
  Trash2,
  MessageSquare,
  Eye,
  Edit3,
  Check,
  X,
  FileText,
  Tag,
  ChevronLeft,
  Loader2,
  Sparkles,
  AlignLeft,
  Languages,
  CornerDownLeft,
} from "lucide-react";

interface NoteEditorProps {
  note: NoteItem;
  currentUserId: string;
  onSave: (updatedFields: Partial<NoteItem>) => Promise<void>;
  onDelete: (noteId: string) => Promise<void>;
  onOpenAISidebar: () => void;
  isSaving: boolean;
  onBackToList?: () => void;
  isGuest?: boolean;
}

export default function NoteEditor({
  note,
  currentUserId,
  onSave,
  onDelete,
  onOpenAISidebar,
  isSaving,
  onBackToList,
}: NoteEditorProps) {
  const isOwner = note.authorId === currentUserId;
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [category, setCategory] = useState(note.category);
  const [tags, setTags] = useState<string[]>(note.tags);
  const [isPinned, setIsPinned] = useState(note.isPinned);
  const [isStarred, setIsStarred] = useState(note.isStarred);
  const [visibility, setVisibility] = useState<"private" | "shared">(
    note.visibility,
  );

  const [newTag, setNewTag] = useState("");
  const [viewMode, setViewMode] = useState<"edit" | "preview">(
    note.authorId === currentUserId ? "edit" : "preview",
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [localDirty, setLocalDirty] = useState(false);

  const [prevNote, setPrevNote] = useState(note);
  if (note._id !== prevNote._id || note.updatedAt !== prevNote.updatedAt) {
    setPrevNote(note);
    setTitle(note.title);
    setContent(note.content);
    setCategory(note.category);
    setTags(note.tags);
    setIsPinned(note.isPinned);
    setIsStarred(note.isStarred);
    setVisibility(note.visibility);
    setLocalDirty(false);
    setViewMode(note.authorId === currentUserId ? "edit" : "preview");
  }

  // Debounced auto-save effect
  useEffect(() => {
    if (!localDirty || !isOwner) return;

    const timer = setTimeout(() => {
      onSave({
        title,
        content,
        category,
        tags,
        isPinned,
        isStarred,
        visibility,
      });
      setLocalDirty(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [
    title,
    content,
    category,
    tags,
    isPinned,
    isStarred,
    visibility,
    localDirty,
    isOwner,
    onSave,
  ]);

  const [suggestion, setSuggestion] = useState("");
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [selectionCoords, setSelectionCoords] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);
  const [refining, setRefining] = useState(false);
  const [selectionResult, setSelectionResult] = useState<{
    action: string;
    text: string;
    rangeStart: number;
    rangeEnd: number;
  } | null>(null);

  const autocompleteTimerRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea to fit content — eliminates scrollbar so overlay matches width
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [content]);

  // Debounced autocomplete — triggers 2.5s after user stops typing
  useEffect(() => {
    if (!isOwner || !content.trim() || content.trim().length < 20) return;

    if (autocompleteTimerRef.current) clearTimeout(autocompleteTimerRef.current);

    autocompleteTimerRef.current = setTimeout(async () => {
      const partialText = content.substring(Math.max(0, content.length - 600));
      if (partialText.trim().length < 15) return;
      setLoadingSuggestion(true);
      try {
        const res = await fetch("/api/ai/note-assist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "autocomplete", content: partialText }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.result?.trim()) setSuggestion(data.result.trim());
        }
      } catch (err) {
        console.error("Autocomplete API error:", err);
      } finally {
        setLoadingSuggestion(false);
      }
    }, 2500);

    return () => { if (autocompleteTimerRef.current) clearTimeout(autocompleteTimerRef.current); };
  }, [content, isOwner]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab" && suggestion) {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent =
        content.substring(0, start) + suggestion + content.substring(end);
      setContent(newContent);
      setLocalDirty(true);
      setSuggestion("");

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd =
          start + suggestion.length;
        textarea.focus();
      }, 0);
    } else if (e.key === "Escape" && suggestion) {
      e.preventDefault();
      setSuggestion("");
    }
  };

  const handleTextareaSelect = (
    e: React.SyntheticEvent<HTMLTextAreaElement>,
  ) => {
    const textarea = e.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    if (start !== end) {
      const selectedStr = textarea.value.substring(start, end).trim();
      if (selectedStr.length >= 3) {
        setSelectedText(selectedStr);
        setSelectionRange({ start, end });
        // Use native selection API for accurate coordinates
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          setSelectionCoords({
            top: rect.top + window.scrollY - 48,
            left: Math.max(8, rect.left + window.scrollX),
          });
        }
        return;
      }
    }
    // Only clear if not showing a result
    if (!selectionResult) {
      setSelectedText("");
      setSelectionCoords(null);
      setSelectionRange(null);
    }
  };

  const runSelectionAIAction = async (
    actionType: "polish-selection" | "summarize" | "translate",
    lang?: string,
  ) => {
    if (!selectedText || !selectionRange) return;
    setRefining(true);
    // hide the toolbar while processing
    setSelectionCoords(null);
    try {
      const res = await fetch("/api/ai/note-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: actionType, content: selectedText, language: lang }),
      });
      if (res.ok) {
        const data = await res.json();
        const resultText: string = data.result ?? "";
        if (resultText.trim()) {
          setSelectionResult({
            action: actionType,
            text: resultText,
            rangeStart: selectionRange.start,
            rangeEnd: selectionRange.end,
          });
        }
      }
    } catch (err) {
      console.error("Error running selection AI action:", err);
    } finally {
      setRefining(false);
      setSelectedText("");
      setSelectionRange(null);
    }
  };

  const applySelectionResult = () => {
    if (!selectionResult) return;
    const { action, text, rangeStart, rangeEnd } = selectionResult;
    if (action === "summarize") {
      const block = `\n\n---\n**Summary:** ${text}\n---\n`;
      setContent(content.substring(0, rangeEnd) + block + content.substring(rangeEnd));
    } else {
      setContent(content.substring(0, rangeStart) + text + content.substring(rangeEnd));
    }
    setLocalDirty(true);
    setSelectionResult(null);
  };

  const dismissSelectionResult = () => setSelectionResult(null);

  // Handle changes and mark as local dirty
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setLocalDirty(true);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setLocalDirty(true);
    setSuggestion(""); // Clear suggestion immediately when typing
  };

  const handleCategoryChange = (val: string) => {
    setCategory(val);
    setLocalDirty(true);
    if (isOwner) {
      onSave({ category: val });
    }
  };

  const togglePin = () => {
    const newVal = !isPinned;
    setIsPinned(newVal);
    if (isOwner) {
      onSave({ isPinned: newVal });
    }
  };

  const toggleStar = () => {
    const newVal = !isStarred;
    setIsStarred(newVal);
    if (isOwner) {
      onSave({ isStarred: newVal });
    }
  };

  const handleVisibilityChange = (val: "private" | "shared") => {
    setVisibility(val);
    if (isOwner) {
      onSave({ visibility: val });
    }
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    const tag = newTag.trim().toLowerCase().replace(/#/g, "");
    if (tag && !tags.includes(tag)) {
      const updatedTags = [...tags, tag];
      setTags(updatedTags);
      setNewTag("");
      setLocalDirty(true);
      if (isOwner) {
        onSave({ tags: updatedTags });
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = tags.filter((t) => t !== tagToRemove);
    setTags(updatedTags);
    setLocalDirty(true);
    if (isOwner) {
      onSave({ tags: updatedTags });
    }
  };

  const handleManualSave = async () => {
    if (!isOwner) return;
    await onSave({
      title,
      content,
      category,
      tags,
      isPinned,
      isStarred,
      visibility,
    });
    setLocalDirty(false);
  };

  // Simple Markdown parser for Preview Mode
  const parseMarkdown = (text: string) => {
    if (!text)
      return <p className="text-zinc-500 italic">No content written yet.</p>;

    const lines = text.split("\n");
    return lines.map((line, idx) => {
      // Headers
      if (line.startsWith("# ")) {
        return (
          <h1 key={idx} className="text-2xl font-bold text-white mt-4 mb-2">
            {line.substring(2)}
          </h1>
        );
      }
      if (line.startsWith("## ")) {
        return (
          <h2 key={idx} className="text-xl font-bold text-white mt-3 mb-2">
            {line.substring(3)}
          </h2>
        );
      }
      if (line.startsWith("### ")) {
        return (
          <h3 key={idx} className="text-lg font-bold text-white mt-2 mb-1">
            {line.substring(4)}
          </h3>
        );
      }
      // Bullet list items
      if (line.startsWith("* ") || line.startsWith("- ")) {
        return (
          <ul key={idx} className="list-disc pl-5 my-1 text-zinc-300">
            <li>{line.substring(2)}</li>
          </ul>
        );
      }
      // Empty line
      if (line.trim() === "") {
        return <div key={idx} className="h-2" />;
      }
      // Standard line
      return (
        <p key={idx} className="text-sm text-zinc-300 leading-relaxed my-1">
          {line}
        </p>
      );
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-sans relative overflow-hidden transition-colors duration-200">
      {/* Top toolbar */}
      <div className="flex items-center justify-between px-3 sm:px-5 h-14 shrink-0 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 transition-colors duration-200">
        <div className="flex items-center gap-2">
          {onBackToList && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBackToList}
              className="md:hidden h-8 w-8 shrink-0 text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-200"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="flex items-center gap-0.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md p-0.5">
            <Button
              variant={viewMode === "edit" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("edit")}
              className="h-7 px-2 sm:px-3 text-xs rounded-md text-zinc-650 dark:text-zinc-350 hover:text-zinc-950 dark:hover:text-white"
            >
              <Edit3 className="h-3.5 w-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">{isOwner ? "Edit" : "Source"}</span>
            </Button>
            <Button
              variant={viewMode === "preview" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("preview")}
              className="h-7 px-2 sm:px-3 text-xs rounded-md text-zinc-650 dark:text-zinc-350 hover:text-zinc-950 dark:hover:text-white"
            >
              <Eye className="h-3.5 w-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">Preview</span>
            </Button>
          </div>
          {!isOwner && (
            <Badge
              variant="outline"
              className="text-xs py-1 px-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50 flex items-center gap-1.5 shrink-0"
            >
              <Lock className="h-3 w-3 shrink-0" />
              <span className="truncate">Read-Only</span>
            </Badge>
          )}

          {/* Saving Indicator — dot only on mobile, text on sm+ */}
          <div className="text-xs text-zinc-500">
            {isSaving ? (
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse shrink-0" />
                <span className="hidden sm:inline">Saving...</span>
              </span>
            ) : localDirty ? (
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                <span className="hidden sm:inline">Unsaved</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-zinc-600">
                <Check className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">Saved</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Assistant button */}
          <Button
            onClick={onOpenAISidebar}
            className="h-8 w-8 sm:w-auto sm:px-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 rounded-md text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <MessageSquare className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
            <span className="hidden sm:inline">Assistant</span>
          </Button>

          {isOwner && (
            <>
              <Button
                onClick={handleManualSave}
                disabled={!localDirty || isSaving}
                className="h-8 w-8 sm:w-auto sm:px-3 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 rounded-md text-xs flex items-center justify-center gap-1.5 font-medium transition-colors"
              >
                <Save className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Save</span>
              </Button>

              {showDeleteConfirm ? (
                <div className="flex items-center gap-1">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onDelete(note._id)}
                    className="h-8 px-2 sm:px-3 rounded-md text-xs"
                  >
                    <span className="hidden sm:inline">Confirm&nbsp;</span>
                    Delete
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="h-8 w-8 p-0 rounded-md"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="h-8 w-8 p-0 rounded-md text-zinc-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 border border-transparent hover:border-red-200 dark:hover:border-red-900/30 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Warning message for Shared notes */}
      {visibility === "shared" && (
        <div className="bg-blue-950/20 border-b border-blue-950 px-6 py-2.5 text-xs text-blue-400 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Unlock className="h-3.5 w-3.5 shrink-0" />
            <span>
              This note is <strong>Shared</strong> with your organization as a
              Knowledge Base article.
            </span>
          </span>
          <span className="text-[10px] text-blue-500 uppercase tracking-wider">
            Author: {note.authorName}
          </span>
        </div>
      )}

      {/* Editor Body */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 md:px-12 py-6 custom-scrollbar">
        <div className="max-w-3xl mx-auto w-full flex flex-col min-h-full">
          {/* Metadata Controls Pane */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-4 mb-6 border-b border-zinc-300/60 dark:border-zinc-800 pb-4">
            {/* Category Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500 font-medium">
                Category:
              </span>
              <Select
                disabled={!isOwner}
                value={category}
                onValueChange={(val) => {
                  if (val) handleCategoryChange(val);
                }}
              >
                <SelectTrigger className="h-8 min-w-[140px] bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-xs rounded-lg text-zinc-800 dark:text-zinc-300">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-300">
                  <SelectItem value="General">General</SelectItem>
                  <SelectItem value="Engineering">Engineering</SelectItem>
                  <SelectItem value="Design">Design</SelectItem>
                  <SelectItem value="Product">Product</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Personal">Personal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Visibility Switch */}
            {isOwner && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500 font-medium">
                  Visibility:
                </span>
                <Select
                  value={visibility}
                  onValueChange={(val) => {
                    if (val === "private" || val === "shared")
                      handleVisibilityChange(val);
                  }}
                >
                  <SelectTrigger className="h-8 min-w-[120px] bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-xs rounded-lg text-zinc-800 dark:text-zinc-300">
                    <SelectValue placeholder="Visibility" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-300">
                    <SelectItem value="private">
                      <span className="flex items-center gap-1.5">
                        <Lock className="h-3 w-3 text-zinc-500" /> Private
                      </span>
                    </SelectItem>
                    <SelectItem value="shared">
                      <span className="flex items-center gap-1.5">
                        <Unlock className="h-3 w-3 text-blue-500" /> Shared
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Pin & Star */}
            {isOwner && (
              <div className="flex items-center gap-1.5 ml-auto">
                <Button
                  variant="ghost"
                  onClick={togglePin}
                  className={`h-8 px-2.5 rounded-lg border text-xs flex items-center gap-1.5 transition-all ${
                    isPinned
                      ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/30"
                      : "bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-zinc-850 dark:hover:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                  }`}
                >
                  <Pin
                    className={`h-3.5 w-3.5 ${isPinned ? "fill-emerald-500/20" : ""}`}
                  />
                  {isPinned ? "Pinned" : "Pin"}
                </Button>

                <Button
                  variant="ghost"
                  onClick={toggleStar}
                  className={`h-8 px-2.5 rounded-lg border text-xs flex items-center gap-1.5 transition-all ${
                    isStarred
                      ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/30"
                      : "bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-zinc-850 dark:hover:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                  }`}
                >
                  <Star
                    className={`h-3.5 w-3.5 ${isStarred ? "fill-amber-500/20" : ""}`}
                  />
                  {isStarred ? "Starred" : "Star"}
                </Button>
              </div>
            )}
          </div>

          {/* Note Content Work Area */}
          {viewMode === "edit" ? (
            <div className="flex flex-col gap-4 h-full">
              <input
                type="text"
                placeholder="Untitled"
                disabled={!isOwner}
                value={title}
                onChange={handleTitleChange}
                className="text-3xl font-bold bg-transparent border-none outline-none text-zinc-900 dark:text-white placeholder-zinc-300 dark:placeholder-zinc-700 w-full focus:ring-0"
              />

              {/* Tags Creator Panel */}
              <div className="flex flex-wrap items-center gap-2 my-2 border-t border-b border-zinc-300/60 dark:border-zinc-800 py-3">
                <div className="flex items-center gap-1 text-zinc-500 text-xs mr-2">
                  <Tag className="h-3.5 w-3.5" />
                  <span>Tags:</span>
                </div>

                {tags.map((t) => (
                  <Badge
                    key={t}
                    variant="secondary"
                    className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 pl-2.5 pr-1.5 py-0.5 rounded-lg flex items-center gap-1.5 text-xs font-normal"
                  >
                    #{t}
                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="text-zinc-450 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </Badge>
                ))}

                {isOwner && (
                  <form onSubmit={handleAddTag} className="inline-flex">
                    <Input
                      type="text"
                      placeholder="+ Add tag..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      className="h-7 w-24 bg-transparent border-dashed border-zinc-400 dark:border-zinc-700 focus:border-zinc-600 hover:border-zinc-500 dark:hover:border-zinc-600 text-xs px-2 rounded-lg"
                    />
                  </form>
                )}
              </div>


              {/* Ghost-text autocomplete overlay */}
              <div className="relative flex-1">
                {suggestion && (
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 pointer-events-none overflow-hidden text-[15px] leading-relaxed whitespace-pre-wrap wrap-break-word p-0.5 md:p-1.5 select-none z-0"
                    style={{ fontFamily: "inherit", wordBreak: "break-word" }}
                  >
                    {/* Invisible clone of text to position ghost at cursor */}
                    <span style={{ visibility: "hidden" }}>{content}</span>
                    {/* Ghost suggestion */}
                    <span className="text-zinc-400 dark:text-zinc-600">{suggestion}</span>
                  </div>
                )}
                <Textarea
                  ref={textareaRef}
                  placeholder="Start writing notes here..."
                  disabled={!isOwner}
                  value={content}
                  onChange={handleContentChange}
                  onKeyDown={handleKeyDown}
                  onSelect={handleTextareaSelect}
                  onMouseUp={handleTextareaSelect}
                  className="relative z-10 bg-transparent border-none outline-none text-zinc-855 dark:text-zinc-200 placeholder-zinc-300 dark:placeholder-zinc-700 w-full resize-none focus:ring-0 p-0.5 md:p-1.5 text-[15px] leading-relaxed min-h-[400px] focus-visible:ring-0 overflow-hidden"
                />
              </div>
            </div>
          ) : (
            <div className="prose dark:prose-invert max-w-none flex flex-col gap-4 text-zinc-850 dark:text-zinc-250">
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
                {title || "Untitled"}
              </h1>

              <div className="flex flex-wrap items-center gap-1.5 my-2 pb-3 border-b border-zinc-300 dark:border-zinc-800">
                {tags.map((t) => (
                  <Badge
                    key={t}
                    variant="secondary"
                    className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 font-normal"
                  >
                    #{t}
                  </Badge>
                ))}
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-900/10 rounded-xl py-2">
                {parseMarkdown(content)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Editor Footer */}
      <div className="px-4 sm:px-6 py-2 border-t border-zinc-200 dark:border-zinc-800 text-[10px] text-zinc-400 dark:text-zinc-600 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950 transition-colors">
        <span className="flex items-center gap-2">
          {loadingSuggestion ? (
            <span className="flex items-center gap-1.5">
              <Loader2 className="h-2.5 w-2.5 animate-spin" />
              <span>generating suggestion...</span>
            </span>
          ) : suggestion ? (
            <span className="flex items-center gap-1.5 animate-in fade-in duration-200">
              <Sparkles className="h-2.5 w-2.5" />
              <span>AI suggestion</span>
              <kbd className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-1 py-0.5 rounded font-mono text-zinc-600 dark:text-zinc-400">Tab</kbd>
              <span>to accept</span>
              <span className="text-zinc-300 dark:text-zinc-700">·</span>
              <kbd className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-1 py-0.5 rounded font-mono text-zinc-600 dark:text-zinc-400">Esc</kbd>
              <span>to dismiss</span>
            </span>
          ) : (
            <>
              <FileText className="h-3 w-3" />
              <span className="hidden sm:inline">Markdown: <code className="bg-zinc-100 dark:bg-zinc-900 px-1 rounded">#</code> headers · <code className="bg-zinc-100 dark:bg-zinc-900 px-1 rounded">-</code> bullets</span>
            </>
          )}
        </span>
        <span className="tabular-nums">{new Date(note.updatedAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}</span>
      </div>



      {/* Selection result preview panel */}
      {selectionResult && (
        <div className="mx-4 sm:mx-6 mb-3 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500 flex items-center gap-1.5">
              {selectionResult.action === "polish-selection" && <><Sparkles className="h-3 w-3" /> Polished text</>}
              {selectionResult.action === "summarize" && <><AlignLeft className="h-3 w-3" /> Summary</>}
              {selectionResult.action === "translate" && <><Languages className="h-3 w-3" /> Translation</>}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={applySelectionResult}
                className="flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
              >
                <CornerDownLeft className="h-3 w-3" />
                Apply
              </button>
              <button
                onClick={dismissSelectionResult}
                className="h-6 w-6 flex items-center justify-center rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="px-3 py-2.5 max-h-36 overflow-y-auto">
            <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">{selectionResult.text}</p>
          </div>
        </div>
      )}

      {/* Floating selection toolbar */}
      {selectionCoords && selectedText && !refining && (
        <div
          style={{ top: `${selectionCoords.top}px`, left: `${selectionCoords.left}px` }}
          className="fixed z-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl p-1 flex items-center gap-0.5 animate-in fade-in zoom-in-95 duration-150"
        >
          <button
            type="button"
            onClick={() => runSelectionAIAction("polish-selection")}
            title="Polish selection"
            className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white text-[10px] font-medium transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Polish</span>
          </button>
          <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-700" />
          <button
            type="button"
            onClick={() => runSelectionAIAction("summarize")}
            title="Summarise selection"
            className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white text-[10px] font-medium transition-colors"
          >
            <AlignLeft className="h-3.5 w-3.5" />
            <span>Summarise</span>
          </button>
          <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-700" />
          <button
            type="button"
            onClick={() => runSelectionAIAction("translate", "ar")}
            title="Translate selection"
            className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white text-[10px] font-medium transition-colors"
          >
            <Languages className="h-3.5 w-3.5" />
            <span>Translate</span>
          </button>
        </div>
      )}

      {/* Refining overlay indicator */}
      {refining && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 shadow-lg text-xs text-zinc-600 dark:text-zinc-400 animate-in fade-in duration-150">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-400" />
          Processing selection...
        </div>
      )}
    </div>
  );
}
