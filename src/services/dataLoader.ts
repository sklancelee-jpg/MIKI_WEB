/**
 * dataLoader — startup hydration, explicit save helpers, and page auto-save.
 *
 * Saves are IMMEDIATE on creation (not debounced) to survive fast app-close.
 * Debounce is kept only for high-frequency edits (renames, color changes, typing).
 */

import type { JSONContent } from '@tiptap/core'
import {
  loadWikiList, saveWikiList,
  loadWikiEntries, saveWikiEntries,
  loadPageFile, savePageFile,
} from './persistence'
import { ensureAbsDir }          from './db'
import { logError }              from '../utils/logger'
import { loadPalette }           from '../stores/usePaletteStore'
import { loadFontsMeta }         from '../stores/useFontStore'
import { loadAndInjectFonts }    from './fontManager'
import { useWikiStore }          from '../stores/useWikiStore'
import { useDirStore }     from '../stores/useDirStore'
import { useAttrStore, type PageData } from '../stores/useAttrStore'
import { useContentStore } from '../stores/useContentStore'
import { useAtlasStore, type AtlasData } from '../stores/useAtlasStore'
import type { DirEntry }   from '../stores/useDirStore'

/** Sanitise a display name for use as a filesystem path component. */
export function sanitizeName(name: string): string {
  return name.replace(/[/\\:*?"<>|]/g, '-').trim() || 'untitled'
}

/* ── Startup hydration ─────────────────────────────────────── */

export async function loadAllData(): Promise<void> {
  const wikis = await loadWikiList()
  useWikiStore.getState().hydrate(wikis)

  const entryResults = await Promise.all(
    wikis.map((w) => loadWikiEntries(w.rootPath).catch(() => []))
  )

  const allEntries = entryResults.flat()
  useDirStore.getState().hydrate(allEntries)

  const pageEntries = allEntries.filter((e) => e.kind === 'page' || e.kind === 'atlas')

  const pageFiles = await Promise.all(
    pageEntries.map((e) =>
      e.osPath ? loadPageFile(e.osPath).catch(() => null) : Promise.resolve(null)
    )
  )

  const attrPages: Record<string, PageData>    = {}
  const contents:  Record<string, JSONContent> = {}
  const atlases:   Record<string, AtlasData>   = {}

  pageFiles.forEach((file, i) => {
    const id = pageEntries[i].id
    if (!file) return
    attrPages[id] = { attributes: file.attributes, coverImage: file.coverImage, pageStyle: file.pageStyle }
    if (file.content) contents[id] = file.content
    if (file.atlasData) atlases[id] = file.atlasData
  })

  useAttrStore.getState().hydratePages(attrPages)
  useContentStore.getState().hydrate(contents)
  useAtlasStore.getState().hydrate(atlases)

  // Load global palette + custom fonts
  await loadPalette()
  await loadFontsMeta()
  await loadAndInjectFonts()

  setupDebounceAutoSave()
}

/* ── Explicit save helpers (call immediately after mutations) ── */

export async function persistWikiList(): Promise<void> {
  await saveWikiList(useWikiStore.getState().wikis)
}

export async function persistWikiEntries(wikiId: string): Promise<void> {
  const wiki = useWikiStore.getState().wikis.find((w) => w.id === wikiId)
  if (!wiki?.rootPath) return
  await ensureAbsDir(wiki.rootPath)
  const entries = useDirStore.getState().entries.filter((e) =>
    belongsToWiki(e.id, wikiId, useDirStore.getState().entries)
  )
  await saveWikiEntries(wiki.rootPath, entries)
}

/* ── Create helpers (store mutation + disk in one call) ─────── */

export async function createFolder(
  name: string, colorHex: string, parentId: string,
  parentOsPath: string, wikiId: string,
): Promise<DirEntry> {
  const osPath = `${parentOsPath}/${sanitizeName(name)}`
  await ensureAbsDir(osPath)
  const entry = useDirStore.getState().addFolder(name, colorHex, parentId, osPath)
  await persistWikiEntries(wikiId)
  return entry
}

export async function createPage(
  name: string, parentId: string,
  parentOsPath: string, wikiId: string,
): Promise<DirEntry> {
  const osPath = `${parentOsPath}/${sanitizeName(name)}.json`
  const entry  = useDirStore.getState().addPage(name, parentId, osPath)
  await persistWikiEntries(wikiId)
  await savePageFile(osPath, null, { attributes: [], coverImage: null })
  return entry
}

export async function createAtlas(
  name: string, parentId: string,
  parentOsPath: string, wikiId: string,
): Promise<DirEntry> {
  const osPath = `${parentOsPath}/${sanitizeName(name)}.json`
  const entry  = useDirStore.getState().addAtlas(name, parentId, osPath)
  await persistWikiEntries(wikiId)
  await savePageFile(osPath, null, { attributes: [], coverImage: null }, { imagePath: '', pins: [], textBoxes: [] })
  return entry
}

export async function createSubAtlas(
  name: string,
  parentAtlasId: string,
  wikiId: string,
): Promise<DirEntry> {
  const entries = useDirStore.getState().entries
  const parentAtlas = entries.find((e) => e.id === parentAtlasId)
  if (!parentAtlas) {
    throw new Error(`Parent atlas not found: ${parentAtlasId}`)
  }

  // Derive parent folder directory path from the parent atlas OS path
  const parts = parentAtlas.osPath.split('/')
  parts.pop()
  const parentFolderOsPath = parts.join('/')

  const osPath = `${parentFolderOsPath}/${sanitizeName(name)}.json`
  const entry  = useDirStore.getState().addAtlas(name, parentAtlasId, osPath)
  await persistWikiEntries(wikiId)
  await savePageFile(osPath, null, { attributes: [], coverImage: null }, { imagePath: '', pins: [], textBoxes: [] })
  return entry
}


/* ── Per-page flush (called from PageView on every keystroke) ── */

export function flushPage(pageId: string, content: JSONContent): void {
  useContentStore.getState().setContent(pageId, content)

  const entry = useDirStore.getState().entries.find((e) => e.id === pageId)
  if (!entry?.osPath) {
    logError({ error_code: 'FLUSH_PAGE_NO_PATH', description: 'flushPage called for entry with no osPath', context_payload: { pageId } })
    return
  }

  const pageData = useAttrStore.getState().getPage(pageId)
  savePageFile(entry.osPath, content, pageData)
    .catch((err) => logError({ error_code: 'FLUSH_PAGE_SAVE_FAILED', description: 'savePageFile failed', context_payload: { pageId, err: String(err) } }))
}

/* ── Per-atlas flush ── */

export function flushAtlas(atlasId: string, atlasData: AtlasData): void {
  useAtlasStore.setState((s) => ({
    atlases: { ...s.atlases, [atlasId]: atlasData },
  }))

  const entry = useDirStore.getState().entries.find((e) => e.id === atlasId)
  if (!entry?.osPath) {
    logError({ error_code: 'FLUSH_ATLAS_NO_PATH', description: 'flushAtlas called for entry with no osPath', context_payload: { atlasId } })
    return
  }

  const pageData = useAttrStore.getState().getPage(atlasId)
  savePageFile(entry.osPath, null, pageData, atlasData)
    .catch((err) => logError({ error_code: 'FLUSH_ATLAS_SAVE_FAILED', description: 'savePageFile failed for atlas', context_payload: { atlasId, err: String(err) } }))
}

/* ── Debounced auto-save (renames, color changes, etc.) ─────── */

function setupDebounceAutoSave(): void {
  let wikiTimer:  ReturnType<typeof setTimeout> | null = null
  let entryTimer: ReturnType<typeof setTimeout> | null = null
  let atlasTimer: ReturnType<typeof setTimeout> | null = null

  useWikiStore.subscribe(() => {
    if (wikiTimer) clearTimeout(wikiTimer)
    wikiTimer = setTimeout(() => {
      saveWikiList(useWikiStore.getState().wikis)
        .catch((err) => logError({ error_code: 'AUTOSAVE_WIKIS_FAILED', description: 'debounced wiki list save failed', context_payload: { err: String(err) } }))
    }, 400)
  })

  useDirStore.subscribe(() => {
    if (entryTimer) clearTimeout(entryTimer)
    entryTimer = setTimeout(() => {
      useWikiStore.getState().wikis.forEach((wiki) => {
        persistWikiEntries(wiki.id)
          .catch((err) => logError({ error_code: 'AUTOSAVE_ENTRIES_FAILED', description: 'debounced entries save failed', context_payload: { wikiId: wiki.id, err: String(err) } }))
      })
    }, 400)
  })

  let prevAtlases = useAtlasStore.getState().atlases
  useAtlasStore.subscribe((state) => {
    const current = state.atlases
    const changedId = Object.keys(current).find((id) => current[id] !== prevAtlases[id])
    prevAtlases = current

    if (!changedId) return

    if (atlasTimer) clearTimeout(atlasTimer)
    atlasTimer = setTimeout(() => {
      const data = current[changedId]
      if (data) {
        flushAtlas(changedId, data)
      }
    }, 800)
  })
}

/** Iterative parent-chain walk with cycle guard — safe for deeply nested or circular entries. */
function belongsToWiki(entryId: string, wikiId: string, entries: DirEntry[]): boolean {
  const visited = new Set<string>()
  let currentId = entryId
  while (currentId) {
    if (visited.has(currentId)) return false  // cycle detected
    visited.add(currentId)
    const entry = entries.find((e) => e.id === currentId)
    if (!entry) return false
    if (entry.parentId === wikiId) return true
    currentId = entry.parentId
  }
  return false
}
