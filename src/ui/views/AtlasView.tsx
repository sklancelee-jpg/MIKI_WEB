/**
 * AtlasView — panel workspace wrapper for visual maps, blueprints, and timelines.
 * Hosts a formatting toolbar, tool selector, pin toggles, image scale slider, and swap-map dropdowns.
 */

import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { open } from '@tauri-apps/plugin-dialog'
import { readFile, writeFile } from '@tauri-apps/plugin-fs'

import { useDirStore } from '../../stores/useDirStore'
import { useWikiStore } from '../../stores/useWikiStore'
import { useNavStore } from '../../stores/useNavStore'
import { useAtlasStore, type TextBox } from '../../stores/useAtlasStore'
import { ensureAbsDir } from '../../services/db'
import FontPicker from '../components/toolbar/FontPicker'
import ColorPicker from '../components/toolbar/ColorPicker'
import AtlasCanvas from '../components/atlas/AtlasCanvas'
import AtlasLeftPanel from '../components/atlas/AtlasLeftPanel'
import { FolderIcon, AtlasIcon, ChevronLeftIcon, TimelineIcon, PinIcon, EyeIcon } from '../components/shared/Icons'
import { logError } from '../../utils/logger'

const AtlasView: React.FC = () => {
  const { wikiId, atlasId } = useParams<{ wikiId: string; atlasId: string }>()
  const navigate = useNavigate()
  const { entries, renameEntry } = useDirStore()
  const { wikis } = useWikiStore()
  const { push, previous } = useNavStore()
  const { getAtlas, setAtlasImage, updateTextBox } = useAtlasStore()

  const entry = entries.find((e) => e.id === atlasId && e.kind === 'atlas')
  const wiki = wikis.find((w) => w.id === wikiId)
  const atlas = getAtlas(atlasId ?? '')

  const [editMode, setEditMode] = useState<'edit' | 'preview'>('preview')
  const [activeTool, setActiveTool] = useState<'pan' | 'pin' | 'text' | 'subatlas'>('pan')
  const [showPins, setShowPins] = useState(true)
  const [focusedTextBoxId, setFocusedTextBoxId] = useState<string | null>(null)
  const [leftPanelOpen, setLeftPanelOpen] = useState(true)
  
  // Scale / Zoom factor controlled globally by toolbar & mouse wheel
  const [scale, setScale] = useState(1)

  // Formatting Dropdowns State
  const [showFonts, setShowFonts] = useState(false)
  const [showColor, setShowColor] = useState(false)
  const [showSwapMap, setShowSwapMap] = useState(false)
  
  const fontWrapRef = useRef<HTMLDivElement>(null)
  const colorWrapRef = useRef<HTMLDivElement>(null)
  const swapMapRef = useRef<HTMLDivElement>(null)

  // Close formatting dropdowns when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as Node
      if (showFonts && fontWrapRef.current && !fontWrapRef.current.contains(t)) setShowFonts(false)
      if (showColor && colorWrapRef.current && !colorWrapRef.current.contains(t)) setShowColor(false)
      if (showSwapMap && swapMapRef.current && !swapMapRef.current.contains(t)) setShowSwapMap(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showFonts, showColor, showSwapMap])

  // Push to navigation history
  useEffect(() => {
    if (atlasId && entry) {
      push({ path: `/wiki/${wikiId}/atlas/${atlasId}`, label: entry.name })
    }
  }, [atlasId, entry?.name]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!wiki || !entry) {
    return (
      <div className="home-view">
        <div className="empty-state">
          <p>Atlas not found.</p>
          <button className="btn--primary" onClick={() => navigate('/')}>Go Home</button>
        </div>
      </div>
    )
  }

  // ── Image Import Flow ──
  const handleUploadImage = async () => {
    try {
      const picked = await open({
        title: 'Select Map or Blueprint Image',
        multiple: false,
        filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'svg'] }],
      })
      if (!picked || typeof picked !== 'string') return

      const filename = picked.split('/').pop()?.split('\\').pop() ?? 'map.png'
      const cleanFilename = `${Date.now()}-${filename.replace(/\s+/g, '_')}`
      const relativePath = `assets/maps-atlases/${cleanFilename}`
      const absoluteDest = `${wiki.rootPath}/${relativePath}`
      const destDir = `${wiki.rootPath}/assets/maps-atlases`

      await ensureAbsDir(destDir)
      const fileData = await readFile(picked)
      await writeFile(absoluteDest, fileData)

      setAtlasImage(entry.id, relativePath)
      setShowSwapMap(false)
    } catch (err) {
      logError({ error_code: 'ATLAS_UPLOAD_FAILED', description: 'failed to import map image', context_payload: { err: String(err) } })
      window.alert('Failed to import map image.')
    }
  }

  // ── Template Selection Flow ──
  const handleSelectTemplate = async (templateName: 'fantasy_map' | 'timeline_template') => {
    try {
      const response = await fetch(`/templates/${templateName}.png`)
      const buffer = await response.arrayBuffer()
      const fileData = new Uint8Array(buffer)

      const cleanFilename = `${Date.now()}-${templateName}.png`
      const relativePath = `assets/maps-atlases/${cleanFilename}`
      const absoluteDest = `${wiki.rootPath}/${relativePath}`
      const destDir = `${wiki.rootPath}/assets/maps-atlases`

      await ensureAbsDir(destDir)
      await writeFile(absoluteDest, fileData)

      setAtlasImage(entry.id, relativePath)
      setShowSwapMap(false)
    } catch (err) {
      logError({ error_code: 'ATLAS_TEMPLATE_FAILED', description: 'failed to load map template', context_payload: { err: String(err) } })
      window.alert('Failed to load map template.')
    }
  }

  // Format modifier helper for focused text box
  const handleFormatChange = (patch: Partial<Omit<TextBox, 'id'>>) => {
    if (focusedTextBoxId && atlasId) {
      updateTextBox(atlasId, focusedTextBoxId, patch)
    }
  }

  // Derive styles of the currently focused text box
  const focusedBox = atlas.textBoxes?.find((b) => b.id === focusedTextBoxId)
  const fontFamily = focusedBox?.fontFamily ?? 'inherit'
  const fontSize = focusedBox?.fontSize ?? 18
  const isBold = focusedBox?.bold ?? false
  const isItalic = focusedBox?.italic ?? false
  const isUnderline = focusedBox?.underline ?? false
  const textColor = focusedBox?.colorHex ?? '#ffffff'

  const fontLabel = fontFamily === 'inherit' ? 'Font' : fontFamily.split(',')[0]

  // Back button path calculation
  const backPath = entry.parentId !== wikiId
    ? `/wiki/${wikiId}/folder/${entry.parentId}`
    : `/wiki/${wikiId}`

  // Retrieve previous label for back button text (e.g. "← Characters")
  const prev = previous()
  const prevLabel = prev ? prev.label : 'Back'

  return (
    <div className="page-view">
      {/* ── Toolbar ── */}
      <header className="toolbar">
        {/* Left: Back button & Title */}
        <div className="toolbar__left" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            className="btn--ghost toolbar__back"
            onClick={() => navigate(backPath)}
            title={`Go back to ${prevLabel}`}
            data-tooltip={`Go back to ${prevLabel}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            <ChevronLeftIcon size={16} /> {prevLabel}
          </button>
          <input
            type="text"
            className="scriptorium__title"
            style={{ fontSize: 20, margin: 0, padding: '4px 8px', maxWidth: 280 }}
            value={entry.name}
            onChange={(e) => renameEntry(entry.id, e.target.value)}
            placeholder="Untitled Atlas"
          />
        </div>

        {/* Center: Formatting tools (styles focused text box) */}
        <div className={`toolbar-center${!focusedTextBoxId || editMode === 'preview' ? ' toolbar-center--disabled' : ''}`}>
          {/* Font family */}
          <div className="fmt-dropdown-wrap" ref={fontWrapRef}>
            <button
              className="fmt-btn fmt-btn--font"
              onClick={() => {
                if (focusedTextBoxId && editMode === 'edit') {
                  setShowFonts((v) => !v)
                  setShowColor(false)
                }
              }}
              disabled={!focusedTextBoxId || editMode === 'preview'}
            >
              {fontLabel} ▾
            </button>
            {showFonts && (
              <FontPicker
                value={fontFamily}
                onChange={(f) => handleFormatChange({ fontFamily: f })}
                onClose={() => setShowFonts(false)}
              />
            )}
          </div>

          {/* Font size */}
          <input
            className="fmt-size-input"
            type="number"
            min={8}
            max={96}
            value={fontSize}
            onChange={(e) => {
              const n = parseInt(e.target.value)
              if (n >= 8 && n <= 96) handleFormatChange({ fontSize: n })
            }}
            disabled={!focusedTextBoxId || editMode === 'preview'}
            title="Font size (px)"
          />

          {/* B / I / U */}
          <div className="fmt-btn-group">
            <button
              className={`fmt-btn fmt-btn--icon${isBold ? ' fmt-btn--active' : ''}`}
              onClick={() => handleFormatChange({ bold: !isBold })}
              disabled={!focusedTextBoxId || editMode === 'preview'}
              title="Bold"
            >
              <strong>B</strong>
            </button>
            <button
              className={`fmt-btn fmt-btn--icon${isItalic ? ' fmt-btn--active' : ''}`}
              onClick={() => handleFormatChange({ italic: !isItalic })}
              disabled={!focusedTextBoxId || editMode === 'preview'}
              title="Italic"
            >
              <em>I</em>
            </button>
            <button
              className={`fmt-btn fmt-btn--icon${isUnderline ? ' fmt-btn--active' : ''}`}
              onClick={() => handleFormatChange({ underline: !isUnderline })}
              disabled={!focusedTextBoxId || editMode === 'preview'}
              title="Underline"
              style={{ textDecoration: 'underline' }}
            >
              U
            </button>
          </div>

          {/* Text color */}
          <div className="fmt-dropdown-wrap" ref={colorWrapRef}>
            <button
              className="fmt-btn fmt-btn--color"
              onClick={() => {
                if (focusedTextBoxId && editMode === 'edit') {
                  setShowColor((v) => !v)
                  setShowFonts(false)
                }
              }}
              disabled={!focusedTextBoxId || editMode === 'preview'}
              title="Text color"
            >
              <span className="fmt-color-preview" style={{ background: textColor }} />A
            </button>
            {showColor && (
              <ColorPicker
                value={textColor}
                onChange={(hex) => handleFormatChange({ colorHex: hex })}
                onClose={() => setShowColor(false)}
              />
            )}
          </div>
        </div>

        {/* Right: Active tools, Zoom slider, Map swap, & Edit/Preview mode */}
        <div className="toolbar__right" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Zoom Slider */}
          {atlas.imagePath && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 4 }}>
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)', minWidth: 32, textAlign: 'right' }}>
                {Math.round(scale * 100)}%
              </span>
              <input
                type="range"
                min="0.15"
                max="3.0"
                step="0.05"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                style={{
                  width: 75,
                  cursor: 'pointer',
                  accentColor: wiki.colorHex,
                  height: 4,
                }}
                title="Resize Map (Zoom)"
              />
            </div>
          )}

          {/* Swap Map Image (Edit Mode Only) */}
          {editMode === 'edit' && atlas.imagePath && (
            <div className="fmt-dropdown-wrap" ref={swapMapRef} style={{ marginRight: 4 }}>
              <button
                className="fmt-btn"
                style={{ padding: '4px 10px', fontSize: 12, height: 28, display: 'inline-flex', alignItems: 'center' }}
                onClick={() => {
                  setShowSwapMap((v) => !v)
                  setShowFonts(false)
                  setShowColor(false)
                }}
                title="Change background map image"
              >
                Swap Map ▾
              </button>
              {showSwapMap && (
                <div
                  className="fmt-dropdown"
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    background: 'var(--color-menu-panel)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 'var(--radius-sm)',
                    width: 200,
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    padding: 4,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                  }}
                >
                  <button
                    type="button"
                    className="fmt-dropdown__item"
                    style={{ textAlign: 'left', padding: '6px 10px', fontSize: 12, display: 'flex', alignItems: 'center' }}
                    onClick={() => handleSelectTemplate('fantasy_map')}
                  >
                    <AtlasIcon size={14} style={{ marginRight: 6 }} /> Fantasy Map Template
                  </button>
                  <button
                    type="button"
                    className="fmt-dropdown__item"
                    style={{ textAlign: 'left', padding: '6px 10px', fontSize: 12, display: 'flex', alignItems: 'center' }}
                    onClick={() => handleSelectTemplate('timeline_template')}
                  >
                    <TimelineIcon /> Chronological Timeline
                  </button>
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />
                  <button
                    type="button"
                    className="fmt-dropdown__item"
                    style={{ textAlign: 'left', padding: '6px 10px', fontSize: 12, display: 'flex', alignItems: 'center' }}
                    onClick={handleUploadImage}
                  >
                    <FolderIcon size={14} style={{ marginRight: 6 }} /> Choose Custom Image...
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Pins Visibility Toggle */}
          <button
            className={`fmt-btn fmt-btn--icon${showPins ? ' fmt-btn--active' : ''}`}
            style={{ padding: '6px 8px', fontSize: 13, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setShowPins((v) => !v)}
            data-tooltip={showPins ? "Hide all pins" : "Show all pins"}
          >
            <EyeIcon size={16} />
          </button>

          {/* Tool Button group (Edit mode only) */}
          {editMode === 'edit' && (
            <div className="fmt-btn-group" style={{ marginLeft: 4 }}>
              <button
                className={`fmt-btn fmt-btn--icon${activeTool === 'pan' ? ' fmt-btn--active' : ''}`}
                onClick={() => {
                  setActiveTool('pan')
                  setFocusedTextBoxId(null)
                }}
                title="Pan / Select Tool"
              >
                ✋
              </button>
              <button
                className={`fmt-btn fmt-btn--icon${activeTool === 'pin' ? ' fmt-btn--active' : ''}`}
                onClick={() => {
                  setActiveTool('pin')
                  setFocusedTextBoxId(null)
                }}
                title="Place Pin Tool"
                data-tooltip="Place Pin Tool"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <PinIcon />
              </button>
              <button
                className={`fmt-btn fmt-btn--icon${activeTool === 'subatlas' ? ' fmt-btn--active' : ''}`}
                onClick={() => {
                  setActiveTool('subatlas')
                  setFocusedTextBoxId(null)
                }}
                title="Place Sub-Atlas Portal Tool"
                data-tooltip="Place Sub-Atlas Portal Tool"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <AtlasIcon size={14} />
              </button>
              <button
                className={`fmt-btn fmt-btn--icon${activeTool === 'text' ? ' fmt-btn--active' : ''}`}
                onClick={() => {
                  setActiveTool('text')
                  setFocusedTextBoxId(null)
                }}
                title="Place Text Tool"
                data-tooltip="Place Text Tool"
              >
                T
              </button>
            </div>
          )}

          {/* Divider */}
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />

          {/* Mode Toggle */}
          <div className="edit-toggle">
            <button
              className={`edit-toggle__btn${editMode === 'edit' ? ' edit-toggle__btn--active' : ''}`}
              onClick={() => {
                setEditMode('edit')
                setFocusedTextBoxId(null)
              }}
            >
              Edit
            </button>
            <button
              className={`edit-toggle__btn${editMode === 'preview' ? ' edit-toggle__btn--active' : ''}`}
              onClick={() => {
                setEditMode('preview')
                setFocusedTextBoxId(null)
                setActiveTool('pan')
              }}
            >
              Preview
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Canvas (Takes 100% width, no RightPanel) ── */}
      <div className="page-panels">
        <AtlasLeftPanel
          open={leftPanelOpen}
          onToggle={() => setLeftPanelOpen(!leftPanelOpen)}
          currentAtlasId={entry.id}
          wikiId={wikiId!}
        />
        <main
          className={[
            'scriptorium',
            !leftPanelOpen && 'scriptorium--wide-left',
            'scriptorium--wide-right', // always wide on the right (no RightPanel)
          ].filter(Boolean).join(' ')}
          style={{
            height: 'calc(100vh - 56px)',
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            backgroundColor: '#070a13', // Deep Procreate desk backdrop
          }}
        >
          <AtlasCanvas
            atlasId={entry.id}
            wikiId={wikiId!}
            editMode={editMode}
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            showPins={showPins}
            focusedTextBoxId={focusedTextBoxId}
            setFocusedTextBoxId={setFocusedTextBoxId}
            scale={scale}
            setScale={setScale}
            onUploadImage={handleUploadImage}
            onSelectTemplate={handleSelectTemplate}
          />
        </main>
      </div>
    </div>
  )
}

export default AtlasView
