import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import HomeView      from './ui/views/HomeView'
import DirectoryView from './ui/views/DirectoryView'
import PageView      from './ui/views/PageView'
import AtlasView     from './ui/views/AtlasView'
import { loadAllData } from './services/dataLoader'
import { buildAppMenu } from './services/appMenu'
import { logError } from './utils/logger'
import './styles/global.css'

// HashRouter is used because Tauri serves on a custom protocol (tauri://)
// and the History API doesn't interact well with it.

async function bootstrap(): Promise<void> {
  // Hydrate all Zustand stores from disk before any component renders.
  // On first run, loadAllData() creates the miki-data/ directory structure
  // and returns empty arrays, so the app starts as normal.
  await loadAllData()

  // Build the native OS menu bar (File, Edit, View).
  await buildAppMenu()

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <HashRouter>
        <Routes>
          <Route path="/"                              element={<HomeView />} />
          <Route path="/wiki/:wikiId"                  element={<DirectoryView />} />
          <Route path="/wiki/:wikiId/folder/:folderId" element={<DirectoryView />} />
          <Route path="/page/:pageId"                  element={<PageView />} />
          <Route path="/wiki/:wikiId/atlas/:atlasId"   element={<AtlasView />} />
        </Routes>
      </HashRouter>
    </React.StrictMode>,
  )
}

bootstrap().catch((err) =>
  logError({ error_code: 'BOOTSTRAP_FAILED', description: 'app bootstrap failed', context_payload: { err: String(err) } })
)
