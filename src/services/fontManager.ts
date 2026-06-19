/**
 * fontManager — installs custom fonts into AppData and injects @font-face CSS.
 *
 * Flow for upload:
 *   installFont() → file dialog → copy binary to AppData/miki-data/fonts/
 *   → base64 @font-face injection → update useFontStore
 *
 * Flow on startup:
 *   loadAndInjectFonts() → read each saved font binary → inject @font-face
 */

import { readFile, writeFile, BaseDirectory } from '@tauri-apps/plugin-fs'
import { open }                               from '@tauri-apps/plugin-dialog'
import { ensureAppDataDir, readAppDataBinary } from './db'
import { useFontStore, type FontEntry, type FontFormat } from '../stores/useFontStore'

const FONTS_DIR = 'miki-data/fonts'

function detectFormat(filename: string): FontFormat {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  if (ext === 'woff2') return 'woff2'
  if (ext === 'woff')  return 'woff'
  if (ext === 'ttf')   return 'ttf'
  return 'otf'
}

function uint8ToBase64(data: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < data.byteLength; i++) binary += String.fromCharCode(data[i])
  return btoa(binary)
}

function cssFormatName(fmt: FontFormat): string {
  return fmt === 'ttf' ? 'truetype' : fmt
}

function injectFontFace(entry: FontEntry, base64: string): void {
  const existing = document.getElementById(`font-face-${entry.id}`)
  if (existing) existing.remove()
  const dataUrl = `data:font/${entry.format};base64,${base64}`
  const style   = document.createElement('style')
  style.id      = `font-face-${entry.id}`
  style.textContent = `@font-face { font-family: "${entry.name}"; src: url("${dataUrl}") format("${cssFormatName(entry.format)}"); font-display: swap; }`
  document.head.appendChild(style)
}

/** Load all saved custom fonts from AppData and inject their CSS. Called at startup. */
export async function loadAndInjectFonts(): Promise<void> {
  const fonts = useFontStore.getState().fonts
  await Promise.all(
    fonts.map(async (entry) => {
      const data = await readAppDataBinary(`fonts/${entry.filename}`)
      if (data) injectFontFace(entry, uint8ToBase64(data))
    })
  )
}

/** Open file picker, copy font to AppData, inject CSS, add to store. */
export async function installFont(): Promise<FontEntry | null> {
  const picked = await open({
    title: 'Choose a font file',
    multiple: false,
    filters: [{ name: 'Font files', extensions: ['woff2', 'woff', 'ttf', 'otf'] }],
  })
  if (!picked || typeof picked !== 'string') return null

  const filename = (picked.split('/').pop() ?? picked.split('\\').pop() ?? 'font')
  const format   = detectFormat(filename)
  const name     = filename.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
  const id       = crypto.randomUUID()
  const entry: FontEntry = { id, name, filename, format }

  await ensureAppDataDir()
  const data = await readFile(picked)
  await writeFile(`${FONTS_DIR}/${filename}`, data, { baseDir: BaseDirectory.AppData })

  injectFontFace(entry, uint8ToBase64(data))
  useFontStore.getState().addFont(entry)
  return entry
}
