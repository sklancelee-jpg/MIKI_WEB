/**
 * searchService — title search across all wikis, folders, and pages.
 * Results include the full ancestor path so the UI can show:
 *   📄 Pikachu  ·  Pokemon / Electric Type
 *
 * Data integrity: navigateTo is always computed from IDs, never from names,
 * so renamed entries still navigate correctly.
 */

import type { Wiki }     from '../stores/useWikiStore'
import type { DirEntry } from '../stores/useDirStore'

export type ResultKind = 'wiki' | 'folder' | 'page' | 'atlas'

export interface SearchResult {
  kind:        ResultKind
  id:          string
  name:        string
  /** Ancestor breadcrumb — e.g. "Pokemon / Electric Type" (excludes the entry itself). */
  path:        string
  /** Full display string — e.g. "Pokemon / Electric Type / Pikachu". */
  displayPath: string
  navigateTo:  string
}

/* ── Path utilities (exported for use by link navigation) ──── */

/**
 * Walk parentId chain upward to find the ancestor wiki ID.
 * Returns null if the chain is broken (orphaned entry).
 */
export function findWikiId(
  parentId: string,
  entries:  DirEntry[],
  wikis:    Wiki[],
): string | null {
  if (wikis.find((w) => w.id === parentId)) return parentId
  const parent = entries.find((e) => e.id === parentId)
  if (!parent) return null
  return findWikiId(parent.parentId, entries, wikis)
}

/**
 * Build the ancestor breadcrumb for an entry, e.g. "Pokemon / Electric Type".
 * Does NOT include the entry's own name.
 */
export function buildAncestorPath(
  parentId: string,
  entries:  DirEntry[],
  wikis:    Wiki[],
): string {
  const parts: string[] = []
  let current = parentId

  // Walk up, collecting names, until we hit a wiki (root) or dead end
  while (true) {
    const wiki = wikis.find((w) => w.id === current)
    if (wiki) { parts.unshift(wiki.name); break }
    const entry = entries.find((e) => e.id === current)
    if (!entry) break
    parts.unshift(entry.name)
    current = entry.parentId
  }

  return parts.join(' / ')
}

/* ── Main search function ────────────────────────────────────── */

export function search(
  query:      string,
  wikis:      Wiki[],
  entries:    DirEntry[],
  maxResults  = 12,
): SearchResult[] {
  if (!query.trim()) return []
  const q = query.toLowerCase()
  const results: SearchResult[] = []

  // Wikis
  for (const w of wikis) {
    if (w.name.toLowerCase().includes(q)) {
      results.push({
        kind:        'wiki',
        id:          w.id,
        name:        w.name,
        path:        '',
        displayPath: w.name,
        navigateTo:  `/wiki/${w.id}`,
      })
    }
  }

  // Folders, pages, and atlases
  for (const e of entries) {
    if (!e.name.toLowerCase().includes(q)) continue

    const ancestorPath = buildAncestorPath(e.parentId, entries, wikis)
    const displayPath  = ancestorPath ? `${ancestorPath} / ${e.name}` : e.name

    if (e.kind === 'page') {
      results.push({
        kind:        'page',
        id:          e.id,
        name:        e.name,
        path:        ancestorPath,
        displayPath,
        navigateTo:  `/page/${e.id}`,
      })
    } else if (e.kind === 'atlas') {
      const wikiId = findWikiId(e.parentId, entries, wikis)
      results.push({
        kind:        'atlas',
        id:          e.id,
        name:        e.name,
        path:        ancestorPath,
        displayPath,
        navigateTo:  wikiId ? `/wiki/${wikiId}/atlas/${e.id}` : '/',
      })
    } else {
      const wikiId = findWikiId(e.parentId, entries, wikis)
      results.push({
        kind:        'folder',
        id:          e.id,
        name:        e.name,
        path:        ancestorPath,
        displayPath,
        navigateTo:  wikiId
          ? `/wiki/${wikiId}/folder/${e.id}`
          : `/wiki/${e.parentId}`,
      })
    }

    if (results.length >= maxResults) break
  }

  return results.slice(0, maxResults)
}
