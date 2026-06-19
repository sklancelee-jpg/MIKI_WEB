# MIKI — Codebase Map

> Update this file on every file add, rename, move, or delete.

## Root
| File | Purpose |
|---|---|
| `package.json` | Dependencies and scripts |
| `tsconfig.json` | TypeScript compiler config |
| `vite.config.ts` | Vite bundler config |
| `index.html` | HTML entry point |
| `TODO.md` | Active task checklist |

## .claude/
| File | Purpose |
|---|---|
| `strict-dev.md` | Engineering standards |
| `project-context.md` | Architecture and roadmap |
| `MAP.md` | This file |
| `domains/editor-rules.md` | Tiptap editor rules |
| `domains/data-rules.md` | File I/O and data layer rules |

## src/config/
| File | Purpose |
|---|---|
| `tokens.ts` | Design tokens: colors, typography, spacing |

## src/models/
| File | Purpose |
|---|---|
| `schemas.ts` | Zod schemas: MikiDocumentSchema, FolderConfigSchema, etc. |

## src/stores/
| File | Purpose |
|---|---|
| `useWikiStore.ts` | Zustand — wiki list (in-memory) |
| `useDirStore.ts` | Zustand — folder/page entries per parentId (in-memory) |
| `usePageViewStore.ts` | Zustand — panel visibility, edit/preview mode |
| `useAttrStore.ts` | Zustand — per-page attributes + cover image, keyed by pageId |
| `useNavStore.ts` | Zustand — nav history stack, push/pop/current/previous |

## src/styles/
| File | Purpose |
|---|---|
| `global.css` | All CSS: dark theme + every component class |

## src/ui/views/
| File | Purpose |
|---|---|
| `HomeView.tsx` | Home screen — wiki card grid |
| `DirectoryView.tsx` | Directory — folder/page grid, sort, context menu |
| `PageView.tsx` | Page editor — toolbar + three collapsible panels |

## src/ui/components/
| File | Purpose |
|---|---|
| `WikiCard.tsx` | Wiki card with folder SVG icon |
| `FolderCard.tsx` | Subfolder card, grid + list modes |
| `PageCard.tsx` | Page card with doc icon, grid + list modes |
| `CreateWikiModal.tsx` | Modal: name + color for new wiki |
| `CreateEntryModal.tsx` | Two-step modal: pick Folder/Page → name + color |
| `DirToolbar.tsx` | Sort tabs + grid/list toggle |
| `ContextMenu.tsx` | Right-click menu: Rename, Delete, Change Color, Move |

## src/ui/components/toolbar/
| File | Purpose |
|---|---|
| `Toolbar.tsx` | Toolbar shell — mounts Left/Center/Right zones |
| `ToolbarLeft.tsx` | Back button (hold=home dropdown) + search bar |
| `ToolbarCenter.tsx` | Font, size, B/I/U, text color controls |
| `ToolbarRight.tsx` | Export dropdown + Edit/Preview toggle |

## src/ui/components/panels/
| File | Purpose |
|---|---|
| `LeftPanel.tsx` | ToC panel — collapsible, lists H1/H2/H3 headings |
| `RightPanel.tsx` | Attributes panel — collapsible, image slot, attr table |

## src/utils/
| File | Purpose |
|---|---|
| `logger.ts` | Structured JSON error logger |

## src/main.tsx
Entry point — HashRouter + three routes (/, /wiki/:wikiId, /page/:pageId).

## src/services/
| File | Purpose |
|---|---|
| `parseHeadingTree.ts` | Extracts H1/H2/H3 from Tiptap JSON AST → TocItem[] for LeftPanel |
| `tiptapToText.ts` | Tiptap AST → plain text string |
| `tiptapToMarkdown.ts` | Tiptap AST → Markdown string |
| `tiptapToRtf.ts` | Tiptap AST → RTF document string (Word-compatible) |
| `exportService.ts` | Export dispatcher: TXT/MD/RTF blob download, PDF via window.print() |
| `db.ts` | Low-level Tauri FS helpers: readAbsJson, writeAbsJson, ensureAbsDir, ensureAppDataDir |
| `persistence.ts` | Typed save/load: loadWikiList, loadWikiEntries, loadPageFile, savePageFile |
| `dataLoader.ts` | Startup hydration + create helpers + debounced auto-save |
| `searchService.ts` | Title search across wikis/folders/pages → SearchResult[] with navigateTo path |
| `fontManager.ts` | Custom font install and CSS @font-face injection |
| `location.ts` | Tauri folder picker helper |
| `appMenu.ts` | Builds the native OS menu bar (File, Edit, View) |

## src/ui/components/editor/
| File | Purpose |
|---|---|
| `MikiEditor.tsx` | Thin EditorContent wrapper — receives editor from PageView |
| `slashItems.ts` | Slash command definitions: H1, H2, H3, Text, Image |
| `SlashMenu.tsx` | React popup for slash commands — keyboard-navigable list |
| `SlashCommandExtension.ts` | Tiptap extension: Suggestion-based slash menu trigger |

## src/utils/
| File | Purpose |
|---|---|
| `logger.ts` | Structured JSON error logger — use logError/logWarn/logInfo, never raw console.error |
| `sanitize.ts` | sanitizeText() — strips control chars from display names and attribute values |
| `colorUtils.ts` | tileGradient, tileLightColor, tileShadow helpers |
