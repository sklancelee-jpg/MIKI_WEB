# MIKI — Active Task Checklist

> This is the single source of truth. Archive completed phases below.

---

## Phase 1 — Foundation ✅
- [x] Run `npm install` to install all dependencies
- [x] Run `npm run tauri init` to scaffold the Tauri backend (`src-tauri/`)
- [x] Add `react-router-dom` and wire up three routes: `/`, `/wiki/:id`, `/page/:id`
- [x] Add global CSS reset and base styles using design tokens from `src/config/tokens.ts`
- [x] Verify dev server runs: `npm run tauri dev`

## Phase 2 — Home + Directory Views (CURRENT)
- [x] `npm install react-router-dom`
- [x] Global dark CSS theme (`src/styles/global.css`)
- [x] Zustand wiki store (`src/stores/useWikiStore.ts`)
- [x] `WikiCard` component with folder SVG icon
- [x] `CreateWikiModal` (name + color picker)
- [x] Updated `HomeView` — card grid, empty state, + button
- [x] Updated `DirectoryView` — wiki header, back nav, empty grid placeholder
- [x] `HashRouter` wired in `main.tsx`
- [x] `FolderCard` component (folder icon, color-coded, grid + list)
- [x] `PageCard` component (doc icon, grid + list; thumbnail Phase 4b)
- [x] `DirToolbar` — sort tabs (Date / Name / Kind) + grid/list toggle
- [x] `CreateEntryModal` — two-step: pick Folder/Page → name + color
- [x] Right-click `ContextMenu` — Rename, Delete, Change Color, Move (stub)
- [x] Updated `DirectoryView` — full grid/list, all modals wired
- [ ] Wire Tauri FS: read wiki root, list folders and pages (Phase 2c)

## Phase 3 — Page View Shell ✅
- [x] Toolbar shell (Left / Center / Right zones)
- [x] Back button — tap = go back, hold 500ms = "Go Home" dropdown
- [x] Search bar stub (inline dropdown, results Phase 6)
- [x] Format controls — font family, size, B/I/U, text color (Tiptap Phase 4)
- [x] Export dropdown stub (PDF/Word/TXT/MD — wired Phase 7)
- [x] Edit/Preview toggle
- [x] Left panel (ToC) — collapsible ◀▶ arrow, ToC list (content Phase 4)
- [x] Right panel (Attributes) — collapsible, image slot, attr table (Phase 5)
- [x] Scriptorium center — white paper sheet, expands as panels collapse

## Phase 4 — Editor Core ✅
- [x] Integrate Tiptap: StarterKit, Heading (H1/H2/H3), Underline, Color, TextStyle, FontFamily, Image, Placeholder
- [x] `parseHeadingTree()` — derives TocItem[] from Tiptap JSON AST
- [x] ToC syncs to LeftPanel in real time via `onUpdate` callback
- [x] Slash commands: `/h1`, `/h2`, `/h3`, `/text`, `/image` (via @tiptap/suggestion + ReactRenderer)
- [x] Toolbar format controls wired to live editor: B/I/U toggle, font family, text color
- [x] Image insertion via URL prompt (`/image` slash command)
- [x] Edit/Preview mode toggles editor `editable` flag
- [ ] **Run `npm install` to activate** — adds @tiptap/suggestion + @tiptap/extension-placeholder

## Phase 5 — Attribute Table ✅
- [x] `useAttrStore` — per-page attributes + cover image, keyed by pageId
- [x] `AttrRow` — inline-editable label/value cells, Tab to advance, × to delete
- [x] `+ Add attribute` — creates row and auto-focuses label
- [x] Cover image slot — click to upload, displays preview, × to remove
- [x] `RightPanel` fully wired — reads/writes from store via pageId prop

## Phase 6 — Navigation + Search ✅
- [x] `useNavStore` — history stack, push/pop/current/previous
- [x] Back button shows previous label ("← Characters") via useNavStore
- [x] Hold 500ms → "Go Home" dropdown
- [x] Search bar — debounced query, arrow-key navigation, × clear
- [x] `searchService.ts` — title search across wikis, folders, pages
- [x] All three views push their label on mount (HomeView, DirectoryView, PageView)

## Phase 7 — Export ✅
- [x] `tiptapToText.ts` — Tiptap AST → plain text
- [x] `tiptapToMarkdown.ts` — Tiptap AST → Markdown (headings, bold, italic, underline, lists, images)
- [x] `tiptapToRtf.ts` — Tiptap AST → RTF (opens in Word, Pages, LibreOffice)
- [x] `exportService.ts` — dispatcher: blob download for TXT/MD/RTF, window.print() for PDF
- [x] `ToolbarRight` wired: passes editor.getJSON() + page name to exportService
- [x] `@media print` CSS: hides all chrome, prints only .scriptorium__paper

## Phase 8 — Data Persistence ✅
- [x] `tauri-plugin-fs` registered in Cargo.toml + lib.rs
- [x] FS permissions in capabilities/default.json (read/write/mkdir/exists, app-data scope)
- [x] `db.ts` — low-level `readJson` / `writeJson` / `ensureRootDir` helpers
- [x] `persistence.ts` — typed `loadMeta` / `saveMeta` / `loadPageFile` / `savePageFile`
- [x] `useContentStore` — Tiptap JSONContent keyed by pageId; hydrated on startup
- [x] `hydrate` / `hydratePages` added to useWikiStore, useDirStore, useAttrStore
- [x] `dataLoader.ts` — startup hydration + debounced auto-save subscriptions for meta
- [x] `main.tsx` bootstraps async: `await loadAllData()` before `ReactDOM.createRoot`
- [x] `PageView` loads stored content into editor; debounced `flushPage` on every edit

## Phase 9 — Later Features
- [ ] Spatial Atlas Engine (map/blueprint/timeline + pins)
- [ ] Page templates (`.wiki/templates/`)
- [ ] Full-wiki `.miki` archive export
- [ ] Custom fonts upload
- [ ] Custom borders, paper textures, caret styles
- [ ] Full-text body search (MVP is title-only)
- [ ] Page thumbnail auto-generation

---

## Completed
_(archive finished phases here)_
