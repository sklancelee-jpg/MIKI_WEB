/**
 * HomeView — entry screen showing all wikis as a card grid.
 * + button → CreateWikiModal → native folder picker → wiki created.
 * Features a context menu for Rename, Delete, Color Change, and Cover Image.
 */

import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { listen } from '@tauri-apps/api/event'
import WikiCard from '../components/WikiCard'
import CreateWikiModal from '../components/CreateWikiModal'
import ColorPopover from '../components/color/ColorPopover'
import SearchBar from '../components/shared/SearchBar'
import ContextMenu, { type ContextMenuState } from '../components/ContextMenu'
import { useWikiStore, type Wiki } from '../../stores/useWikiStore'
import { useNavStore }  from '../../stores/useNavStore'
import { pickFolder }   from '../../services/location'
import { ensureAbsDir } from '../../services/db'
import { persistWikiList } from '../../services/dataLoader'

const HomeView: React.FC = () => {
  const { wikis, addWiki, renameWiki, removeWiki, updateWikiColor, setWikiCover } = useWikiStore()
  const navigate                  = useNavigate()
  const { push }                  = useNavStore()
  const [showModal, setShowModal] = useState(false)
  const [picking, setPicking]     = useState(false)

  // Context Menu State
  const [ctxMenu, setCtxMenu]     = useState<ContextMenuState | null>(null)
  const [renameId, setRenameId]   = useState<string | null>(null)
  const [renameName, setRenameName] = useState('')
  const [activeCoverTargetId, setActiveCoverTargetId] = useState<string | null>(null)
  const [reframingId, setReframingId] = useState<string | null>(null)
  const [colorPickerState, setColorPickerState] = useState<{ id: string; x: number; y: number; originalColor: string } | null>(null)
  const contextMenuFileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { push({ path: '/', label: 'Home' }) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for File → New Wiki from the native menu
  useEffect(() => {
    const unlisten = listen('menu:new-wiki', () => setShowModal(true))
    return () => { void unlisten.then((fn) => fn()) }
  }, [])

  /**
   * Called when the user confirms name + color in CreateWikiModal.
   * Opens a native folder picker so they choose where to store the wiki.
   * The wiki folder ({chosen}/{name}/) is created by the first persistence write.
   */
  const handleCreateWiki = async (name: string, color: string) => {
    setShowModal(false)
    setPicking(true)

    try {
      const parent = await pickFolder(`Choose where to keep "${name}"`)
      if (!parent) return  // user cancelled — wiki not created

      // Sanitise the name for use as a folder name
      const folderName = name.replace(/[/\\:*?"<>|]/g, '-').trim()
      const rootPath   = `${parent}/${folderName}`

      const wiki = addWiki(name, color, rootPath)
      await ensureAbsDir(rootPath)
      await persistWikiList()
      navigate(`/wiki/${wiki.id}`)
    } finally {
      setPicking(false)
    }
  }

  const handleContextMenu = (e: React.MouseEvent, wiki: Wiki) => {
    e.preventDefault()
    setCtxMenu({
      x: e.clientX,
      y: e.clientY,
      entryId: wiki.id,
      entryKind: 'wiki' as any,
      entryName: wiki.name,
      hasCover: !!wiki.coverImage,
    })
  }

  const handleRenameStart = (id: string) => {
    const wiki = wikis.find((w) => w.id === id)
    if (wiki) {
      setRenameId(id)
      setRenameName(wiki.name)
    }
  }

  const handleRenameCommit = () => {
    if (renameId && renameName.trim()) {
      renameWiki(renameId, renameName.trim())
    }
    setRenameId(null)
  }

  const handleDeleteWiki = (id: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this wiki? This is irreversible.')
    if (confirmed) {
      removeWiki(id)
    }
  }

  const handleChangeColor = (id: string) => {
    const wiki = wikis.find((w) => w.id === id)
    setColorPickerState({ id, x: ctxMenu!.x, y: ctxMenu!.y, originalColor: wiki?.colorHex ?? '#ef4444' })
    setCtxMenu(null)
  }

  const handleChangeCover = (id: string) => {
    setActiveCoverTargetId(id)
    contextMenuFileInputRef.current?.click()
  }

  const handleContextMenuFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && activeCoverTargetId) {
      const reader = new FileReader()
      reader.onload = () => {
        setWikiCover(activeCoverTargetId, reader.result as string)
        setActiveCoverTargetId(null)
      }
      reader.readAsDataURL(file)
    }
    e.target.value = ''
  }

  return (
    <div className="home-view">
      {/* ── Header ── */}
      <header className="home-view__header">
        <h1 className="home-view__title">My Wikis</h1>
        <SearchBar className="home-view__search" />
        <button
          className="btn--plus"
          onClick={() => setShowModal(true)}
          aria-label="Create wiki"
          disabled={picking}
        >
          +
        </button>
      </header>

      {/* ── Content ── */}
      {wikis.length === 0 ? (
        <div className="empty-state">
          <p>No wikis yet.</p>
          <button className="btn--primary" onClick={() => setShowModal(true)}>
            Create your first wiki
          </button>
        </div>
      ) : (
        <div className="card-grid">
          {wikis.map((wiki) => (
            <WikiCard
              key={wiki.id}
              wiki={wiki}
              isReframing={reframingId === wiki.id}
              onReframeStart={() => setReframingId(wiki.id)}
              onReframeEnd={() => setReframingId(null)}
              onClick={() => navigate(`/wiki/${wiki.id}`)}
              onContextMenu={(e) => handleContextMenu(e, wiki)}
            />
          ))}
        </div>
      )}

      {/* ── Modals ── */}
      {showModal && (
        <CreateWikiModal
          onConfirm={handleCreateWiki}
          onCancel={() => setShowModal(false)}
        />
      )}

      {/* ── Color picker popover ── */}
      {colorPickerState && (
        <ColorPopover
          x={colorPickerState.x}
          y={colorPickerState.y}
          currentColor={colorPickerState.originalColor}
          onPreview={(color) => updateWikiColor(colorPickerState.id, color)}
          onConfirm={(color) => { updateWikiColor(colorPickerState.id, color); setColorPickerState(null) }}
          onCancel={() => { updateWikiColor(colorPickerState.id, colorPickerState.originalColor); setColorPickerState(null) }}
        />
      )}

      {/* ── Folder picker in progress indicator ── */}
      {picking && (
        <div className="modal-overlay">
          <div className="modal" style={{ textAlign: 'center', padding: '32px 40px' }}>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-micro)' }}>
              Waiting for folder selection…
            </p>
          </div>
        </div>
      )}

      {/* ── Context Menu ── */}
      {ctxMenu && (
        <ContextMenu
          state={ctxMenu}
          onRename={handleRenameStart}
          onDelete={handleDeleteWiki}
          onChangeColor={handleChangeColor}
          onChangeCover={handleChangeCover}
          onAdjustCover={(id) => setReframingId(id)}
          onRemoveCover={(id) => setWikiCover(id, null)}
          onClose={() => setCtxMenu(null)}
        />
      )}

      <input
        ref={contextMenuFileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleContextMenuFileChange}
      />

      {renameId && (
        <div className="modal-overlay" onClick={handleRenameCommit}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal__title">Rename Wiki</h2>
            <input
              className="modal__input"
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleRenameCommit() }}
              autoFocus
            />
            <div className="modal__actions">
              <button className="btn--ghost" onClick={() => setRenameId(null)}>Cancel</button>
              <button className="btn--primary" onClick={handleRenameCommit}>Rename</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HomeView
