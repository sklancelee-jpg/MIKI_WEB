/**
 * persistence — typed save/load.
 *
 * Global (AppData):
 *   miki-data/wikis.json            — list of all Wiki objects (id, name, colorHex, rootPath)
 *
 * Per-wiki (inside wiki's chosen rootPath):
 *   {rootPath}/entries.json          — all DirEntry objects for that wiki
 *   {entry.osPath}                   — page content + attributes + cover image
 */

import type { Wiki }     from '../stores/useWikiStore'
import type { DirEntry } from '../stores/useDirStore'
import type { PageData } from '../stores/useAttrStore'
import type { AtlasData } from '../stores/useAtlasStore'
import type { JSONContent } from '@tiptap/core'
import {
  ensureAppDataDir, readAppDataJson, writeAppDataJson,
  ensureAbsDir, readAbsJson, writeAbsJson,
} from './db'
import {
  WikiRuntimeSchema,
  DirEntryRuntimeSchema,
  PageFileRuntimeSchema,
} from '../models/schemas'
import { logError } from '../utils/logger'

export interface PageFile {
  content:    JSONContent | null
  attributes: PageData['attributes']
  coverImage: PageData['coverImage']
  pageStyle?: PageData['pageStyle']
  atlasData?: AtlasData
}

/* ── Global wiki list ── */

export async function loadWikiList(): Promise<Wiki[]> {
  await ensureAppDataDir()
  const raw = await readAppDataJson<unknown[]>('wikis.json')
  if (!raw) return []
  const result = WikiRuntimeSchema.array().safeParse(raw)
  if (!result.success) {
    logError({ error_code: 'PERSIST_WIKIS_INVALID', description: 'wikis.json failed validation', context_payload: { issues: result.error.issues } })
    return []
  }
  return result.data as Wiki[]
}

export async function saveWikiList(wikis: Wiki[]): Promise<void> {
  await writeAppDataJson('wikis.json', wikis)
}

/* ── Per-wiki entries ── */

export async function loadWikiEntries(rootPath: string): Promise<DirEntry[]> {
  const raw = await readAbsJson<unknown[]>(`${rootPath}/entries.json`)
  if (!raw) return []
  const result = DirEntryRuntimeSchema.array().safeParse(raw)
  if (!result.success) {
    logError({ error_code: 'PERSIST_ENTRIES_INVALID', description: `entries.json at ${rootPath} failed validation`, context_payload: { issues: result.error.issues } })
    return []
  }
  return result.data as DirEntry[]
}

export async function saveWikiEntries(
  rootPath: string,
  entries:  DirEntry[],
): Promise<void> {
  await ensureAbsDir(rootPath)
  await writeAbsJson(`${rootPath}/entries.json`, entries)
}

/* ── Per-page data ── */

export async function loadPageFile(osPath: string): Promise<PageFile | null> {
  const raw = await readAbsJson<unknown>(osPath)
  if (raw === null || raw === undefined) return null
  const result = PageFileRuntimeSchema.safeParse(raw)
  if (!result.success) {
    logError({ error_code: 'PERSIST_PAGE_INVALID', description: `page file at ${osPath} failed validation`, context_payload: { issues: result.error.issues } })
    return null
  }
  return result.data as PageFile
}

export async function savePageFile(
  osPath:   string,
  content:  JSONContent | null,
  pageData: PageData,
  atlasData?: AtlasData,
): Promise<void> {
  const dir = osPath.substring(0, osPath.lastIndexOf('/'))
  await ensureAbsDir(dir)
  await writeAbsJson(osPath, {
    content,
    attributes: pageData.attributes,
    coverImage: pageData.coverImage,
    pageStyle:  pageData.pageStyle,
    atlasData,
  } satisfies PageFile)
}
