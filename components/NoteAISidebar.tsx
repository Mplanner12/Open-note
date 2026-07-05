'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  X,
  FileText,
  Languages,
  Tags,
  AlignLeft,
  Clipboard,
  Check,
  RotateCcw,
  Pencil,
  ChevronRight,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface NoteAISidebarProps {
  noteContent: string;
  isOpen: boolean;
  onClose: () => void;
  onApplyTags: (tags: string[]) => void;
  onAppendContent: (text: string) => void;
  onReplaceContent: (text: string) => void;
}

const ACTIONS = [
  { id: 'polish',       label: 'Polish document',    description: 'Format and clean up writing',    icon: FileText, color: 'text-emerald-500 dark:text-emerald-400' },
  { id: 'suggest-tags', label: 'Suggest tags',        description: 'Generate relevant labels',       icon: Tags,     color: 'text-blue-500 dark:text-blue-400' },
  { id: 'summarize',    label: 'Summarise',           description: 'Create a concise TL;DR',        icon: AlignLeft, color: 'text-violet-500 dark:text-violet-400' },
  { id: 'autocomplete', label: 'Continue writing',    description: 'Extend the current draft',      icon: Pencil,   color: 'text-amber-500 dark:text-amber-400' },
];

export default function NoteAISidebar({
  noteContent,
  isOpen,
  onClose,
  onApplyTags,
  onAppendContent,
  onReplaceContent,
}: NoteAISidebarProps) {
  const [loading, setLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [transLang, setTransLang] = useState('ar');

  if (!isOpen) return null;

  const runAIAction = async (action: string, languageCode?: string) => {
    setLoading(true);
    setActiveAction(action);
    setAiResult(null);
    setSuggestedTags([]);

    try {
      const res = await fetch('/api/ai/note-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, content: noteContent, language: languageCode }),
      });

      const data = await res.json();

      if (data.error) {
        setAiResult(`Error: ${data.error}`);
      } else if (action === 'suggest-tags') {
        try {
          const tags = JSON.parse(data.result);
          setSuggestedTags(tags);
          setAiResult(`Suggested ${tags.length} tags`);
        } catch {
          setAiResult(`Could not parse tags: ${data.result}`);
        }
      } else {
        setAiResult(data.result);
      }
    } catch (err: unknown) {
      console.error(err);
      setAiResult('Request failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!aiResult) return;
    navigator.clipboard.writeText(aiResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const actionConfig = ACTIONS.find((a) => a.id === activeAction);

  return (
    <div className="w-72 shrink-0 border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 flex flex-col h-full z-20 animate-in slide-in-from-right duration-200 transition-colors overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-200 dark:border-zinc-800">
        <span className="text-sm font-semibold text-zinc-900 dark:text-white">Writing assistant</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-7 w-7 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-5">

          {/* Action list */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-600 mb-2">
              Tools
            </p>
            <div className="divide-y divide-zinc-100 dark:divide-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
              {ACTIONS.map(({ id, label, description, icon: Icon, color }) => (
                <button
                  key={id}
                  onClick={() => runAIAction(id)}
                  disabled={loading || !noteContent}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900 disabled:opacity-40 disabled:cursor-not-allowed ${
                    activeAction === id && loading ? 'bg-zinc-50 dark:bg-zinc-900' : 'bg-white dark:bg-zinc-950'
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">{label}</p>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-600 truncate">{description}</p>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-zinc-300 dark:text-zinc-700 shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Translation widget */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-600 mb-2 flex items-center gap-1.5">
              <Languages className="h-3 w-3" />
              Translate
            </p>
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
              <div className="flex items-center gap-0 divide-x divide-zinc-200 dark:divide-zinc-800">
                <Select value={transLang} onValueChange={(val) => { if (val) setTransLang(val); }}>
                  <SelectTrigger className="h-9 bg-white dark:bg-zinc-950 border-0 text-xs rounded-none text-zinc-700 dark:text-zinc-300 flex-1 focus:ring-0 shadow-none">
                    <SelectValue placeholder="Language" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-300 text-xs">
                    <SelectItem value="ar">Arabic</SelectItem>
                    <SelectItem value="az">Azerbaijani</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="zh">Chinese</SelectItem>
                    <SelectItem value="ja">Japanese</SelectItem>
                  </SelectContent>
                </Select>
                <button
                  onClick={() => runAIAction('translate', transLang)}
                  disabled={loading || !noteContent}
                  className="h-9 px-3 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                >
                  Translate
                </button>
              </div>
            </div>
          </div>

          {/* Result panel */}
          {(loading || aiResult !== null) && (
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
              {/* Result header */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
                  {actionConfig?.label ?? 'Result'}
                </span>
                {aiResult && !loading && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleCopy}
                      className="h-5 w-5 flex items-center justify-center rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                      title="Copy"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Clipboard className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={() => runAIAction(activeAction || 'polish', activeAction === 'translate' ? transLang : undefined)}
                      className="h-5 w-5 flex items-center justify-center rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                      title="Regenerate"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Result body */}
              <div className="p-3">
                {loading ? (
                  <div className="space-y-2 py-2">
                    {[80, 60, 90, 50].map((w, i) => (
                      <div key={i} className={`h-2.5 rounded bg-zinc-100 dark:bg-zinc-900 animate-pulse`} style={{ width: `${w}%` }} />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Suggested tags */}
                    {activeAction === 'suggest-tags' && suggestedTags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {suggestedTags.map((tag) => (
                          <Badge
                            key={tag}
                            className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px] rounded font-normal"
                          >
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Text result */}
                    {aiResult && activeAction !== 'suggest-tags' && (
                      <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                        {aiResult}
                      </p>
                    )}

                    {/* Action buttons */}
                    <div className="space-y-1.5 pt-1 border-t border-zinc-100 dark:border-zinc-900">
                      {activeAction === 'suggest-tags' && suggestedTags.length > 0 && (
                        <button
                          onClick={() => onApplyTags(suggestedTags)}
                          className="w-full text-xs font-medium h-8 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                        >
                          Apply tags
                        </button>
                      )}
                      {activeAction === 'summarize' && aiResult && (
                        <button
                          onClick={() => onAppendContent(`\n\n${aiResult}`)}
                          className="w-full text-xs font-medium h-8 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                        >
                          Insert at bottom
                        </button>
                      )}
                      {activeAction === 'autocomplete' && aiResult && (
                        <button
                          onClick={() => onAppendContent(aiResult)}
                          className="w-full text-xs font-medium h-8 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                        >
                          Append to note
                        </button>
                      )}
                      {(activeAction === 'translate' || activeAction === 'polish') && aiResult && (
                        <button
                          onClick={() => onReplaceContent(aiResult)}
                          className="w-full text-xs font-medium h-8 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                        >
                          Replace note content
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
