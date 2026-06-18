# MIKI — Engineering Standards (HOW to write code)

## Hard Limits
- **200 lines max** per `.ts` / `.tsx` source file. Split immediately if exceeded.
- **300 lines max** per `.claude/` markdown file. Split into domain files if exceeded.
- **MAP.md must be updated** on every file add, rename, move, or delete. No exceptions.

## Architecture Rules
- React components are **stateless presentational only**. No business logic inside components.
- All state lives in **Zustand stores** outside the React render cycle.
- Business logic lives in `src/services/`. Services are pure functions — no DOM, no React imports.
- Zod validates **all data at boundaries**: file reads, user inputs, attribute table values.
- Data is **immutable** — always return new objects, never mutate in place.

## TypeScript Rules
- `strict: true` always. No `any` except inside Tiptap content arrays (`z.array(z.any())`).
- Explicit return types on all exported functions.
- Airbnb style guide for formatting.
- Self-documenting names: `parseHeadingTree()` not `parse()`.

## File Structure Rules
- `src/config/` — design tokens, constants only. No logic.
- `src/models/` — Zod schemas and TypeScript types only. No business logic.
- `src/services/` — pure business logic. No UI imports.
- `src/ui/` — React components and views. No direct file I/O.
- `src/utils/` — shared helpers (logger, error handler). No domain logic.

## Error Handling
- Never swallow errors silently.
- All errors must use the structured JSON schema: `{ error_code, description, context_payload }`.
- Log via `src/utils/logger.ts` only — never raw `console.log` in production code.

## Security
- Zod validates all incoming data before it touches core logic.
- No hardcoded secrets or tokens anywhere in the repo.
- All user text input passes through XSS sanitization before being written to disk.
