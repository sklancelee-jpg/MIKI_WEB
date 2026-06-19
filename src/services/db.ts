/**
 * db — low-level Tauri FS helpers with two path modes:
 *
 * AppData mode  — relative paths under BaseDirectory.AppData/miki-data/
 *                 Used for the global wiki list (wikis.json).
 *
 * Absolute mode — full OS paths like /Users/lance/Documents/MyWiki/
 *                 Used for per-wiki entries.json and pages/{id}.json.
 */

import {
  readTextFile,
  writeTextFile,
  readFile,
  writeFile,
  mkdir,
  exists,
  BaseDirectory,
} from '@tauri-apps/plugin-fs'

const APP_ROOT = 'miki-data'

/* ── AppData helpers ─────────────────────────────────────── */

export async function ensureAppDataDir(): Promise<void> {
  await mkdir(APP_ROOT, { baseDir: BaseDirectory.AppData, recursive: true })
}

export async function readAppDataJson<T>(rel: string): Promise<T | null> {
  try {
    const ok = await exists(`${APP_ROOT}/${rel}`, { baseDir: BaseDirectory.AppData })
    if (!ok) return null
    const text = await readTextFile(`${APP_ROOT}/${rel}`, { baseDir: BaseDirectory.AppData })
    return JSON.parse(text) as T
  } catch { return null }
}

export async function writeAppDataJson(rel: string, data: unknown): Promise<void> {
  await writeTextFile(
    `${APP_ROOT}/${rel}`,
    JSON.stringify(data, null, 2),
    { baseDir: BaseDirectory.AppData },
  )
}

/* ── Absolute-path helpers ───────────────────────────────── */

export async function ensureAbsDir(absPath: string): Promise<void> {
  await mkdir(absPath, { recursive: true })
}

export async function readAbsJson<T>(absPath: string): Promise<T | null> {
  try {
    const ok = await exists(absPath)
    if (!ok) return null
    const text = await readTextFile(absPath)
    return JSON.parse(text) as T
  } catch { return null }
}

export async function writeAbsJson(absPath: string, data: unknown): Promise<void> {
  await writeTextFile(absPath, JSON.stringify(data, null, 2))
}

/* ── Binary AppData helpers (for font files) ─────────────── */

export async function readAppDataBinary(rel: string): Promise<Uint8Array | null> {
  try {
    const ok = await exists(`${APP_ROOT}/${rel}`, { baseDir: BaseDirectory.AppData })
    if (!ok) return null
    return await readFile(`${APP_ROOT}/${rel}`, { baseDir: BaseDirectory.AppData })
  } catch { return null }
}

export async function writeAppDataBinary(rel: string, data: Uint8Array): Promise<void> {
  await writeFile(`${APP_ROOT}/${rel}`, data, { baseDir: BaseDirectory.AppData })
}
