# MIKI — Codebase Map

> Update this file on every file add, rename, move, or delete.

## Root
| File | Purpose |
|---|---|
| `package.json` | Dependencies and scripts |
| `tsconfig.json` | TypeScript compiler config |
| `tsconfig.node.json` | TypeScript config for Vite |
| `vite.config.ts` | Vite bundler config |
| `index.html` | HTML entry point |
| `.gitignore` | Git exclusions |
| `TODO.md` | Active task checklist |

## .claude/
| File | Purpose |
|---|---|
| `strict-dev.md` | Engineering standards — HOW to write code |
| `project-context.md` | Architecture and roadmap — WHAT to build |
| `MAP.md` | This file — codebase topography index |
| `domains/editor-rules.md` | Tiptap editor-specific rules |
| `domains/data-rules.md` | File I/O and data layer rules |

## src/config/
| File | Purpose |
|---|---|
| `tokens.ts` | Design tokens: colors, typography, spacing |

## src/models/
| File | Purpose |
|---|---|
| `schemas.ts` | Zod schemas: MikiDocumentSchema, MikiCanvasStylingSchema, FolderConfigSchema |

## src/services/
| File | Purpose |
|---|---|
| _(empty — services added per phase)_ | |

## src/ui/views/
| File | Purpose |
|---|---|
| `HomeView.tsx` | Home screen — grid of wiki cards |
| `DirectoryView.tsx` | Directory screen — grid of folder/page cards |
| `PageView.tsx` | Page editor — three-panel layout shell |

## src/ui/components/
| File | Purpose |
|---|---|
| _(empty — components added per phase)_ | |

## src/utils/
| File | Purpose |
|---|---|
| `logger.ts` | Structured JSON error logger |

## tests/
| File | Purpose |
|---|---|
| _(empty — tests added per service)_ | |
