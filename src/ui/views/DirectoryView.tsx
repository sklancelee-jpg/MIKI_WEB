/**
 * DirectoryView — card grid for a wiki root or subfolder.
 * No panels here — panels only exist in PageView.
 */

import React, { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useWikiStore } from '../../stores/useWikiStore'
import { useDirStore, type DirEntry } from '../../stores/useDirStore'
import { useNavStore } from '../../stores/useNavStore'
import { createFolder, createPage, createAtlas } from '../../services/dataLoader'
import FolderCard from '../components/FolderCard'
import PageCard from '../components/PageCard'
import AtlasCard from '../components/AtlasCard'
import DirToolbar, { type SortKey, type ViewMode } from '../components/DirToolbar'
import SearchBar from '../components/shared/SearchBar'
import CreateEntryModal from '../components/CreateEntryModal'
import ContextMenu, { type ContextMenuState } from '../components/ContextMenu'
import ColorPopover from '../components/color/ColorPopover'
import { ChevronLeftIcon } from '../components/shared/Icons'

const DirectoryView: React.FC = () => {
  const { wikiId, folderId }    = useParams<{ wikiId: string; folderId: string }>()
  const navigate                = useNavigate()
  const { wikis }               = useWikiStore()
  const { entries, getChildren, removeEntry, renameEntry, updateEntryColor }
                                = useDirStore()
  const { push }                = useNavStore()

  const parentId = folderId ?? wikiId ?? ''
  const wiki     = wikis.find((w) => w.id === wikiId)

  const [sort, setSort]           = useState<SortKey>('name')
  const [viewMode, setViewMode]   = useState<ViewMode>('grid')
  const [showModal, setShowModal] = useState(false)
  const [ctxMenu, setCtxMenu]     = useState<ContextMenuState | null>(null)
  const [renameId, setRenameId]   = useState<string | null>(null)
  const [renameName, setRenameName] = useState('')
  const [activeCoverTargetId, setActiveCoverTargetId] = useState<string | null>(null)
  const [reframingId, setReframingId] = useState<string | null>(null)
  const [colorPickerState, setColorPickerState] = useState<{ id: string; x: number; y: number; originalColor: string } | null>(null)
  const contextMenuFileInputRef = React.useRef<HTMLInputElement>(null)

  const handleChangeCover = (id: string) => {
    setActiveCoverTargetId(id)
    contextMenuFileInputRef.current?.click()
  }

  const handleContextMenuFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && activeCoverTargetId) {
      const reader = new FileReader()
      reader.onload = () => {
        useDirStore.getState().setEntryCover(activeCoverTargetId, reader.result as string)
        setActiveCoverTargetId(null)
      }
      reader.readAsDataURL(file)
    }
    e.target.value = ''
  }

  const handleRemoveCover = (id: string) => {
    useDirStore.getState().setEntryCover(id, null)
  }

  const children = getChildren(parentId)

  // Push this directory to nav history so the back button can show its label
  useEffect(() => {
    const folderEntry = folderId ? entries.find((e) => e.id === folderId) : undefined
    const label = folderEntry?.name ?? wiki?.name ?? 'Directory'
    const path  = folderId ? `/wiki/${wikiId}/folder/${folderId}` : `/wiki/${wikiId}`
    if (wikiId) push({ path, label })
  }, [wikiId, folderId]) // eslint-disable-line react-hooks/exhaustive-deps

  const sorted = useMemo<DirEntry[]>(() => {
    const copy = [...children]
    if (sort === 'name') copy.sort((a, b) => a.name.localeCompare(b.name))
    if (sort === 'date') copy.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    if (sort === 'kind') copy.sort((a, b) => a.kind.localeCompare(b.kind))
    return copy
  }, [children, sort])

  if (!wiki) {
    return (
      <div className="home-view">
        <div className="empty-state">
          <p>Wiki not found.</p>
          <button className="btn--primary" onClick={() => navigate('/')}>Go home</button>
        </div>
      </div>
    )
  }

  const handleCreate = async (kind: DirEntry['kind'], name: string, color: string) => {
    const parentOsPath = folderId
      ? (entries.find((e) => e.id === folderId)?.osPath ?? wiki.rootPath)
      : wiki.rootPath

    if (kind === 'folder') {
      await createFolder(name, color, parentId, parentOsPath, wikiId!)
    } else if (kind === 'atlas') {
      const atlas = await createAtlas(name, parentId, parentOsPath, wikiId!)
      setShowModal(false)
      navigate(`/wiki/${wikiId}/atlas/${atlas.id}`)
      return
    } else {
      const page = await createPage(name, parentId, parentOsPath, wikiId!)
      setShowModal(false)
      navigate(`/page/${page.id}`)
      return
    }
    setShowModal(false)
  }

  const handleContextMenu = (e: React.MouseEvent, entry: DirEntry) => {
    e.preventDefault()
    setCtxMenu({
      x: e.clientX,
      y: e.clientY,
      entryId: entry.id,
      entryKind: entry.kind,
      entryName: entry.name,
      hasCover: !!entry.coverImage,
    })
  }

  const handleRenameStart = (id: string) => {
    const entry = children.find((e) => e.id === id)
    if (entry) { setRenameId(id); setRenameName(entry.name) }
  }

  const handleRenameCommit = () => {
    if (renameId && renameName.trim()) renameEntry(renameId, renameName.trim())
    setRenameId(null)
  }

  const backPath = folderId ? `/wiki/${wikiId}` : '/'
  const folderEntry = folderId ? entries.find((e) => e.id === folderId) : undefined
  const heading  = folderEntry ? folderEntry.name : wiki.name

  return (
    <div className="home-view">
      {/* Header */}
      <header className="home-view__header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn--ghost" style={{ padding: '6px 12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => navigate(backPath)}>
            <ChevronLeftIcon size={16} />
          </button>
          <h1 className="home-view__title" style={{ color: wiki.colorHex }}>{heading}</h1>
        </div>
        <SearchBar className="dir-view__search" />
        <button className="btn--plus" onClick={() => setShowModal(true)} aria-label="New item">+</button>
      </header>

      {/* Toolbar */}
      <DirToolbar sort={sort} viewMode={viewMode} onSortChange={setSort} onViewModeChange={setViewMode} />

      {/* Grid / List */}
      {sorted.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 40 }}>
          <p>Nothing here yet.</p>
          <button className="btn--primary" onClick={() => setShowModal(true)}>Add folder or page</button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="card-grid" style={{ marginTop: 24 }}>
          {sorted.map((entry) =>
            entry.kind === 'folder' ? (
              <FolderCard key={entry.id} entry={entry} viewMode="grid"
                isReframing={reframingId === entry.id}
                onReframeStart={() => setReframingId(entry.id)}
                onReframeEnd={() => setReframingId(null)}
                onClick={() => navigate(`/wiki/${wikiId}/folder/${entry.id}`)}
                onContextMenu={(e) => handleContextMenu(e, entry)} />
            ) : entry.kind === 'atlas' ? (
              <AtlasCard key={entry.id} entry={entry} viewMode="grid"
                wikiColor={wiki.colorHex}
                isReframing={reframingId === entry.id}
                onReframeStart={() => setReframingId(entry.id)}
                onReframeEnd={() => setReframingId(null)}
                onClick={() => navigate(`/wiki/${wikiId}/atlas/${entry.id}`)}
                onContextMenu={(e) => handleContextMenu(e, entry)} />
            ) : (
              <PageCard key={entry.id} entry={entry} viewMode="grid"
                wikiColor={wiki.colorHex}
                isReframing={reframingId === entry.id}
                onReframeStart={() => setReframingId(entry.id)}
                onReframeEnd={() => setReframingId(null)}
                onClick={() => navigate(`/page/${entry.id}`)}
                onContextMenu={(e) => handleContextMenu(e, entry)} />
            )
          )}
        </div>
      ) : (
        <div className="entry-list" style={{ marginTop: 16 }}>
          {sorted.map((entry) =>
            entry.kind === 'folder' ? (
              <FolderCard key={entry.id} entry={entry} viewMode="list"
                onClick={() => navigate(`/wiki/${wikiId}/folder/${entry.id}`)}
                onContextMenu={(e) => handleContextMenu(e, entry)} />
            ) : entry.kind === 'atlas' ? (
              <AtlasCard key={entry.id} entry={entry} viewMode="list"
                wikiColor={wiki.colorHex}
                onClick={() => navigate(`/wiki/${wikiId}/atlas/${entry.id}`)}
                onContextMenu={(e) => handleContextMenu(e, entry)} />
            ) : (
              <PageCard key={entry.id} entry={entry} viewMode="list"
                wikiColor={wiki.colorHex}
                onClick={() => navigate(`/page/${entry.id}`)}
                onContextMenu={(e) => handleContextMenu(e, entry)} />
            )
          )}
        </div>
      )}

      {/* Color picker popover */}
      {colorPickerState && (
        <ColorPopover
          x={colorPickerState.x}
          y={colorPickerState.y}
          currentColor={colorPickerState.originalColor}
          onPreview={(color) => updateEntryColor(colorPickerState.id, color)}
          onConfirm={(color) => { updateEntryColor(colorPickerState.id, color); setColorPickerState(null) }}
          onCancel={() => { updateEntryColor(colorPickerState.id, colorPickerState.originalColor); setColorPickerState(null) }}
        />
      )}

      {/* Modals */}
      {showModal && <CreateEntryModal onConfirm={handleCreate} onCancel={() => setShowModal(false)} />}
      {ctxMenu && (
        <ContextMenu state={ctxMenu}
          onRename={handleRenameStart}
          onDelete={(id) => removeEntry(id)}
          onChangeColor={(id) => {
            const entry = children.find((e) => e.id === id)
            setColorPickerState({ id, x: ctxMenu!.x, y: ctxMenu!.y, originalColor: entry?.colorHex ?? '#ef4444' })
            setCtxMenu(null)
          }}
          onChangeCover={handleChangeCover}
          onAdjustCover={(id) => setReframingId(id)}
          onRemoveCover={handleRemoveCover}
          onClose={() => setCtxMenu(null)} />
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
            <h2 className="modal__title">Rename</h2>
            <input className="modal__input" value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleRenameCommit() }}
              autoFocus />
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

export default DirectoryView
