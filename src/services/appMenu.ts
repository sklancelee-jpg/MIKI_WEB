/**
 * appMenu — builds the native macOS / Windows menu bar.
 * Menu items emit Tauri events; views subscribe and react.
 *
 * Events emitted:
 *   menu:new-wiki        → HomeView opens CreateWikiModal
 *   menu:export-pdf      → active PageView triggers PDF export
 *   menu:export-rtf      → active PageView triggers Word (RTF) export
 *   menu:export-txt      → active PageView triggers TXT export
 *   menu:export-md       → active PageView triggers Markdown export
 */

import { Menu, Submenu, MenuItem, PredefinedMenuItem } from '@tauri-apps/api/menu'
import { emit } from '@tauri-apps/api/event'

const e = (ev: string) => () => void emit(ev)

export async function buildAppMenu(): Promise<void> {
  const fileMenu = await Submenu.new({
    text: 'File',
    items: [
      await MenuItem.new({
        text: 'New Wiki',
        accelerator: 'CmdOrCtrl+N',
        action: e('menu:new-wiki'),
      }),
      await PredefinedMenuItem.new({ item: 'Separator' }),
      await Submenu.new({
        text: 'Export Page As',
        items: [
          await MenuItem.new({ text: 'PDF',         accelerator: 'CmdOrCtrl+Shift+P', action: e('menu:export-pdf') }),
          await MenuItem.new({ text: 'Word (RTF)',   accelerator: 'CmdOrCtrl+Shift+W', action: e('menu:export-rtf') }),
          await MenuItem.new({ text: 'Plain Text',                                     action: e('menu:export-txt') }),
          await MenuItem.new({ text: 'Markdown',                                       action: e('menu:export-md')  }),
        ],
      }),
      await PredefinedMenuItem.new({ item: 'Separator' }),
      await PredefinedMenuItem.new({ item: 'Quit' }),
    ],
  })

  const editMenu = await Submenu.new({
    text: 'Edit',
    items: [
      await PredefinedMenuItem.new({ item: 'Undo' }),
      await PredefinedMenuItem.new({ item: 'Redo' }),
      await PredefinedMenuItem.new({ item: 'Separator' }),
      await PredefinedMenuItem.new({ item: 'Cut' }),
      await PredefinedMenuItem.new({ item: 'Copy' }),
      await PredefinedMenuItem.new({ item: 'Paste' }),
      await PredefinedMenuItem.new({ item: 'SelectAll' }),
    ],
  })

  const viewMenu = await Submenu.new({
    text: 'View',
    items: [
      await PredefinedMenuItem.new({ item: 'Fullscreen' }),
      await PredefinedMenuItem.new({ item: 'Minimize' }),
    ],
  })

  const menu = await Menu.new({ items: [fileMenu, editMenu, viewMenu] })
  await menu.setAsAppMenu()
}
