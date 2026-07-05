# Open Note — Collaborative Workspace & AI Notes

Open Note is a modern, high-performance, distraction-free collaborative workspace for drafting notes, brainstorming ideas, and building a synchronized team knowledge base. Featuring a sleek, data-dense design system, a fully integrated Markdown engine, and state-of-the-art AI helpers.

## Features

### 1. Unified Workspace & Note Browser
*   **Dynamic Filtering:** Filter notes by folders (Engineering, Design, Product, Marketing, Personal, General), search by title/tags/content, and sort by date or alphabetical order.
*   **Sticky & Starred Notes:** Pin critical notes to the top of your sidebar and star frequently accessed items for rapid context switching.
*   **Responsive Side-by-Side Panels:** Seamless multi-column layout on desktop that collapses elegantly into single-view navigation on mobile devices.

### 2. Markdown Editor & Layout Toggle
*   **Source View:** Write raw notes using simple markdown syntax (headers, bullets, dividers) in a distraction-free text editor.
*   **Live Preview:** Toggle from raw text to rendered HTML view instantly.
*   **Auto-Save & Status Indicators:** Changes auto-save in the background with sleek status indicators (Saved, Unsaved Changes, Saving).

### 3. Integrated AI Note Assistants
*   **Inline Ghost Autocomplete:** Generates smart sentence completions inline as you type. Accept with `Tab` or dismiss with `Esc`.
*   **Interactive Selection Toolbar:** Highlight any text inside the editor to activate a floating toolbar.
    *   **Polish:** Clean grammar, spelling, flow, and formatting.
    *   **Summarize:** Append a TL;DR summary block right beneath the selection.
    *   **Translate:** Translate to Spanish, French, German, Chinese, Japanese, Arabic, and more.
*   **Assistant Sidebar Panel:** A collapsible side drawer to discuss ideas, expand outlines, and refine documents.

### 4. Enterprise Knowledge Base
*   **Shared Visibility:** Toggle visibility from private to shared to instantly publish articles to the organization's Knowledge Base.
*   **Read-Only Safe Mode:** Shared notes from other members are presented in read-only preview mode to ensure information security.

### 5. Volatile Guest Session
*   **Instant Access:** Try out all workspace features without registering an account.
*   **Warning Strips:** Prominent notifications warn users about note volatility and provide quick call-to-action paths to register accounts and persist notes.

---

## Technical Stack

*   **Framework:** Next.js (App Router)
*   **Runtime:** React 19, TypeScript
*   **Styles:** Tailwind CSS (Modern HSL Color Tokens)
*   **Icons:** Lucide React
*   **Llm Provider:** Groq (Llama-3.3-70b-versatile) / Local Sandbox fallback

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment variables
Create a `.env.local` file in the root directory:
```env
GROQ_API_KEY=your-groq-api-key
NEXTAUTH_SECRET=your-nextauth-secret
# MongoDB Connection String (Optional, fallback to Local JSON DB if not set)
MONGODB_URI=mongodb://localhost:27017/open-note
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to experience Open Note.
