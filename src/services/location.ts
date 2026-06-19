/**
 * location — thin wrapper around the Tauri dialog folder picker.
 * Used during wiki creation to let the user choose where to store the wiki.
 */

import { open } from '@tauri-apps/plugin-dialog'

/**
 * Opens a native folder-picker dialog.
 * Returns the selected absolute path, or null if the user cancelled.
 */
export async function pickFolder(title = 'Choose folder'): Promise<string | null> {
  const result = await open({
    directory: true,
    multiple:  false,
    title,
  })
  if (Array.isArray(result)) return result[0] ?? null
  return result as string | null
}
