---
name: miki-product-vision
description: Complete product vision, UX flow, and UI specification for the MIKI personal knowledge app. Use this skill whenever working on MIKI — building features, making UI decisions, scaffolding components, discussing app structure, or answering any question about how MIKI should look or behave. Trigger on any mention of MIKI, the wiki app, personal knowledge app, or when the user asks to build, design, or discuss any part of the MIKI interface or feature set.
---

# MIKI Product Vision

MIKI (Me-Ki) is a local-first personal knowledge app — a "Me-Wiki." All data lives on the user's device as real files and folders. No cloud, no sync, total data ownership.

---

## The Three Views

### 1. Home View
The first screen on every boot. Shows all wikis as a grid of cards.

- Grid card style (reference: Apple Files app — folder icons + document previews)
- `+` button → enter name → pick color → wiki created → directory view opens
- Each card shows the wiki name and its color

### 2. Directory View
A full-page grid showing the contents of a wiki or folder. Folders and pages coexist in the same grid.

- **Folder cards**: folder icon in the folder's assigned color
- **Page cards**: live preview thumbnail of the page content
- Sort bar at top: Date | Name | Kind
- Grid / List view toggle
- `+` button (corner) → "New Folder" or "New Page"
- Long-press / right-click on any card → context menu: Rename, Delete, Change Color, Move
- Folders nest infinitely (folder → folder → folder, no depth limit)
- Loose pages (not inside any subfolder) sit directly in the wiki root folder

### 3. Page View
The writing environment. Three panels + toolbar. **Panels only exist here** — not in directory view.

---

## File Structure on Disk

A wiki is just a named folder. No special file format.

```
MyWiki/                     ← the wiki (a regular folder, user-named)
├── .wiki/                  ← hidden config: name, color, nav history
├── loose-page.json         ← pages not in any subfolder live here
├── Characters/             ← a user-created subfolder
│   ├── dragon.json
│   └── Ancient Dragons/    ← nested subfolder (infinite depth)
│       └── elder-dragon.json
└── assets/
    ├── page-thumbnails/    ← auto-generated previews for directory cards
    ├── folder-covers/
    ├── custom-fonts/
    └── maps-atlases/
```

Each page is a single atomic `.json` file containing the full Tiptap content tree, styling config, and attribute table.

---

## Page View Layout

```
┌──────────────────────────────────────────────────────────────┐
│  TOOLBAR (full width)                                        │
├────────────┬─────────────────────────────────┬──────────────┤
│            │                                 │              │
│  LEFT      │       CENTER BODY               │  RIGHT       │
│  PANEL     │       (Scriptorium)             │  PANEL       │
│  (ToC)     │                                 │  (Attrs)     │
│            │                                 │              │
│ collapsible│   always visible, expands       │ collapsible  │
│ ◀ arrow   │   when panels are hidden        │ arrow ▶      │
└────────────┴─────────────────────────────────┴──────────────┘
```

### Toolbar (left → right)

**Left side:**
- **Back button** — go to previous page/directory. Hold → dropdown appears with "Go Home" option (jumps to Home view)
- **Search bar** — inline dropdown results as user types. Format: `page/Dragon`, `folder/Dragon`. Searches by title only (MVP).

**Center (formatting):**
- Font selector
- Font size
- Bold | Italic | Underline
- Text color picker

**Right side:**
- **Export** — exports the current page as: PDF, Word (.docx), TXT, Markdown
- **Edit / Preview toggle** — switches between write mode and read-only preview

### Left Panel — Table of Contents
- Auto-populated from H1, H2, H3 headings in the body
- Collapsible via a collapse arrow on the panel edge
- Only reflects the current open page's headings

### Center Body — Scriptorium
- Always visible; expands to fill space when left/right panels are collapsed
- Headings created via: **toolbar heading selector** OR **slash commands** (`/h1`, `/h2`, `/h3`)
- **MVP content blocks:** headings, body text, images (with captions + float left/right/center alignment)
- **Later iterations:** tables, dividers, bullet lists, numbered lists, checkboxes, callout blocks

### Right Panel — Attribute Table
- Editable label/value pairs; no upper limit on number of attributes
- `+ Add attribute` button at the bottom
- Image upload at the top — reference image for a character, place, object, etc.
- Collapsible via a collapse arrow on the panel edge

---

## Navigation Flow

```
Home ──→ Directory ──→ Directory ──→ Page View
  (wikis)   (wiki root)  (subfolder)
                          ↑
              Back button goes up one level.
              Hold back → "Go Home" jumps to Home.
```

---

## Creation Flows

| Action | Steps |
|---|---|
| New wiki | `+` on Home → name → color → empty directory opens |
| New folder | `+` in directory → "New Folder" → name → color → appears in grid |
| New page | `+` in directory → "New Page" → name → blank page editor opens |
| New attribute | `+ Add attribute` in right panel → type label → type value |

---

## Search Behavior

- Lives in the toolbar as a persistent search bar
- Typing opens an **inline dropdown** (not a modal)
- Results show matching pages and folders by title
- Format: `page/Dragon`, `folder/Dragon`
- If both a page and folder share a name, both appear as separate results

---

## Export

- **Per-page export** (toolbar button): PDF, Word (.docx), TXT, Markdown
- **Full-wiki archive** (.miki file): separate feature, not the toolbar export

---

## Visual Design Tokens (from Master Spec)

| Token | Value |
|---|---|
| Studio backdrop | `#0b132b` |
| Menu panels | `#1c2541` |
| Text / sheets | `#ffffff` |
| Primary accent | `#6366f1` (indigo) |
| Success | Green |
| Error | Red |
| Warning/Pending | Amber |
| H1 | 32px |
| Body | 18px |
| Micro/labels | 14px |

Aesthetic: Procreate-inspired dark studio desk. Pages float as high-contrast white sheets over the dark background. WCAG 2.2 compliant.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Presentation | React 19 + TypeScript 5.5 (stateless components) |
| State | Zustand (external stores, outside React render cycle) |
| Editor | Tiptap (headless, AST/JSON node tree) |
| Validation | Zod (boundary firewall on all data in/out) |
| Desktop | Tauri or Electron |

---

## Hard Code Rules

- **200 lines max** per `.ts` / `.tsx` source file — split into sub-files if exceeded
- **300 lines max** per `.claude/` markdown doc
- **MAP.md** must be updated on every file add/change/delete
- All state changes are **immutable** — dispatch to Zustand, never mutate in place
- Zod validates at every data boundary (file reads, user input, attributes)
- TypeScript strict typing throughout — no `any` except inside Tiptap content arrays
- Airbnb style guide for TypeScript/JavaScript formatting
- Self-documenting function names (`calculateAtlasMarkerPosition` not `calcPos`)

---

## MVP vs Later

### MVP (confirmed, build first)
- Home view, directory view, page view
- Wiki/folder/page creation with name + color
- Infinite folder nesting
- Toolbar: back (hold=home), search dropdown, formatting, export, edit/preview toggle
- Left ToC panel + right attribute panel (both collapsible)
- Headings via toolbar + slash commands
- Images with captions and alignment
- Per-page export: PDF, Word, TXT, Markdown
- Card grid with sort, list toggle, context menu

### Later Iterations
- Tables, dividers, bullet lists, numbered lists, checkboxes
- Spatial Atlas Engine (drop a map/blueprint, click to place pins linking to pages)
- Full-wiki .miki archive export
- Custom fonts (.woff2, .ttf, .otf upload)
- Custom borders, paper textures, caret styles
- Page templates (.wiki/templates/)
- Full-text body search (MVP is title-only)
- Page thumbnails auto-generation
