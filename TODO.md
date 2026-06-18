# MIKI — Active Task Checklist

> This is the single source of truth. Archive completed phases below.

---

## Phase 1 — Foundation (CURRENT)
- [ ] Run `npm install` to install all dependencies
- [ ] Run `npm run tauri init` to scaffold the Tauri backend (`src-tauri/`)
- [ ] Add `react-router-dom` and wire up three routes: `/`, `/wiki/:id`, `/page/:id`
- [ ] Add global CSS reset and base styles using design tokens from `src/config/tokens.ts`
- [ ] Verify dev server runs: `npm run tauri dev`

## Phase 2 — Home + Directory Views
- [ ] Build `WikiCard` component (name, color, click to open)
- [ ] Build `FolderCard` component (folder icon, color-coded)
- [ ] Build `PageCard` component (thumbnail preview)
- [ ] Build card grid layout with sort bar (Date / Name / Kind) and list toggle
- [ ] Build `+` button → "New Folder" / "New Page" modal
- [ ] Build right-click / long-press context menu (Rename, Delete, Change Color, Move)
- [ ] Wire up Tauri file system: read wiki root, list folders and pages

## Phase 3 — Page View Shell
- [ ] Build toolbar layout (left / center / right zones)
- [ ] Build back button with hold-to-home dropdown
- [ ] Build collapsible left panel with arrow toggle
- [ ] Build collapsible right panel with arrow toggle
- [ ] Center panel expands when side panels collapse
- [ ] Add edit / preview toggle button to toolbar

## Phase 4 — Editor Core
- [ ] Integrate Tiptap with StarterKit, Heading (H1/H2/H3), Underline, Color, FontFamily
- [ ] Build `parseHeadingTree()` service — derives ToC from Tiptap JSON AST
- [ ] Sync heading tree to left panel ToC in real time
- [ ] Build slash command extension (`/h1`, `/h2`, `/h3`, `/image`)
- [ ] Build toolbar formatting controls (font, size, bold, italic, underline, color)
- [ ] Implement image insertion with caption + alignment

## Phase 5 — Attribute Table
- [ ] Build right panel attribute table (label + value rows)
- [ ] `+ Add attribute` button at bottom
- [ ] Edit / delete individual attributes inline
- [ ] Image upload at top of right panel
- [ ] Wire attribute data into `MikiDocumentSchema.attributes`

## Phase 6 — Navigation + Search
- [ ] Wire `useNavigationHistoryStore` (Zustand) for back button
- [ ] Hold-to-home dropdown on back button
- [ ] Search bar in toolbar — inline dropdown results
- [ ] Search service: scan page/folder titles across wiki, return `page/Title` + `folder/Title`

## Phase 7 — Export
- [ ] Per-page PDF export (`PDFExportService.ts`)
- [ ] Per-page Word (.docx) export
- [ ] Per-page TXT export
- [ ] Per-page Markdown export
- [ ] Export button in toolbar with format picker

## Phase 8 — Later Features
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
