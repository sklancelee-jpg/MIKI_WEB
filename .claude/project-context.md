# MIKI — Project Context (WHAT to build)

## What is MIKI?
A local-first personal knowledge app ("Me-Wiki"). All data lives on the user's device as real
folders and JSON files. No cloud, no sync, total data ownership and privacy.

## Tech Stack
- React 19 + TypeScript 5.5 (stateless presentation tier)
- Zustand v5 (global state, external to React render cycle)
- Tiptap v2 (headless rich text editor, AST/JSON node tree)
- Zod v3 (boundary validation firewall)
- Tauri v2 (desktop app wrapper — Rust backend, Vite/React frontend)
- Vite v6 (bundler)

## The Three Views
1. **Home View** — grid of wiki cards. Entry point on every boot.
2. **Directory View** — grid of folder + page cards. Navigates the wiki file tree.
3. **Page View** — three-panel editor (left ToC, center body, right attributes).

## Data Model
- A wiki is a named folder on disk. No special file format.
- Pages are atomic `.json` files (Tiptap tree + styling + attributes).
- Hidden `.wiki/` folder inside each wiki stores metadata (name, color, nav history).
- Folders nest infinitely. Loose pages sit in the wiki root.

## GitHub Repo
https://github.com/sklancelee-jpg/miki-miki

## Build Phases (see TODO.md for active tasks)
1. Phase 1 — Foundation: project scaffold, design tokens, Zod schemas, router
2. Phase 2 — Home + Directory views: wiki/folder/page creation, card grid, context menu
3. Phase 3 — Page View shell: three-panel layout, toolbar, collapsible panels
4. Phase 4 — Editor core: Tiptap integration, headings, slash commands, ToC sync
5. Phase 5 — Attribute table: right panel, add/edit/delete attributes, image upload
6. Phase 6 — Navigation: back button, hold-to-home, search dropdown
7. Phase 7 — Export: per-page PDF, Word, TXT, Markdown
8. Phase 8 — Later features: Atlas Engine, templates, custom fonts, full-text search
