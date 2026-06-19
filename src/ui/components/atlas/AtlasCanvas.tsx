/**
 * AtlasCanvas — interactive canvas for visual maps, blueprints, and timelines.
 * Handles drag pan, scroll zoom, pin placement, resizable text boxes, and tool behaviors.
 */

import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { readFile } from '@tauri-apps/plugin-fs'
import { AtlasIcon, TimelineIcon } from '../shared/Icons'
import { logError } from '../../../utils/logger'
import { useAtlasStore, type Pin, type TextBox } from '../../../stores/useAtlasStore'
import { useWikiStore } from '../../../stores/useWikiStore'
import { useDirStore } from '../../../stores/useDirStore'
import { findWikiId } from '../../../services/searchService'
import PinPopover from './PinPopover'
import SubAtlasPopover from './SubAtlasPopover'

interface AtlasCanvasProps {
  atlasId: string
  wikiId: string
  editMode: 'edit' | 'preview'
  activeTool: 'pan' | 'pin' | 'text' | 'subatlas'
  setActiveTool: (tool: 'pan' | 'pin' | 'text' | 'subatlas') => void
  showPins: boolean
  focusedTextBoxId: string | null
  setFocusedTextBoxId: (id: string | null) => void
  
  // Lifted Zoom State
  scale: number
  setScale: (scale: number) => void
  
  // Delegated file import triggers
  onUploadImage: () => Promise<void>
  onSelectTemplate: (name: 'fantasy_map' | 'timeline_template') => Promise<void>
}

const AtlasCanvas: React.FC<AtlasCanvasProps> = ({
  atlasId, wikiId, editMode, activeTool, setActiveTool, showPins,
  focusedTextBoxId, setFocusedTextBoxId, scale, setScale,
  onUploadImage, onSelectTemplate,
}) => {
  const navigate = useNavigate()
  const { getAtlas, addPin, updatePin, removePin, addTextBox, updateTextBox, removeTextBox } = useAtlasStore()
  const { wikis } = useWikiStore()
  const { entries } = useDirStore()

  const atlas = getAtlas(atlasId)
  const wiki = wikis.find((w) => w.id === wikiId)

  // Pan State
  const [translate, setTranslate] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })

  // Pin Configuration Popover State
  const [popoverCoords, setPopoverCoords] = useState<{ x: number; y: number } | null>(null)
  const [editingPin, setEditingPin] = useState<Pin | null>(null)
  const [draggedPinId, setDraggedPinId] = useState<string | null>(null)
  const [draggedBoxId, setDraggedBoxId] = useState<string | null>(null)
  const [hoveredPinId, setHoveredPinId] = useState<string | null>(null)

  // Image URL loading state
  const [imageUrl, setImageUrl] = useState<string>('')
  const viewportRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  // Convert relative file path to an object URL using createObjectURL (avoids base64 overhead).
  // Revoke the previous URL on each change to prevent memory leaks.
  useEffect(() => {
    if (!atlas.imagePath || !wiki) {
      setImageUrl('')
      return
    }
    const absolutePath = `${wiki.rootPath}/${atlas.imagePath}`
    const ext = atlas.imagePath.split('.').pop()?.toLowerCase() ?? 'png'
    const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg'
                   : ext === 'svg' ? 'image/svg+xml'
                   : ext === 'webp' ? 'image/webp'
                   : 'image/png'

    let objectUrl = ''
    readFile(absolutePath)
      .then((binary) => {
        const blob = new Blob([binary], { type: mimeType })
        objectUrl = URL.createObjectURL(blob)
        setImageUrl(objectUrl)
      })
      .catch((e) => {
        logError({ error_code: 'ATLAS_IMAGE_READ_FAILED', description: 'failed to read atlas map file', context_payload: { absolutePath, err: String(e) } })
      })

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [atlas.imagePath, wiki])

  // Reset zoom & pan when image changes
  useEffect(() => {
    setScale(1)
    setTranslate({ x: 0, y: 0 })
    setPopoverCoords(null)
    setEditingPin(null)
    setFocusedTextBoxId(null)
  }, [atlas.imagePath]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!wiki) return null

  // ── Panning & Zooming Event Handlers ──
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const zoomIntensity = 0.08
    const delta = e.deltaY < 0 ? 1 : -1
    const newScale = Math.max(0.15, Math.min(3.0, scale + delta * zoomIntensity))
    setScale(newScale)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.detail === 2) return

    // Pan with left click on background in pan tool mode, or middle click anywhere
    if ((e.button === 0 && activeTool === 'pan') || e.button === 1) {
      if (draggedPinId || draggedBoxId) return
      setIsPanning(true)
      setPanStart({
        x: e.clientX - translate.x,
        y: e.clientY - translate.y,
      })
      setPopoverCoords(null)
      setEditingPin(null)
      setFocusedTextBoxId(null)
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setTranslate({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      })
    } else if (draggedPinId && imgRef.current) {
      const rect = imgRef.current.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const clickY = e.clientY - rect.top
      const xPct = Math.max(0, Math.min(100, (clickX / rect.width) * 100))
      const yPct = Math.max(0, Math.min(100, (clickY / rect.height) * 100))

      updatePin(atlasId, draggedPinId, { x: xPct, y: yPct })
    } else if (draggedBoxId && imgRef.current) {
      const rect = imgRef.current.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const clickY = e.clientY - rect.top
      const xPct = Math.max(0, Math.min(100, (clickX / rect.width) * 100))
      const yPct = Math.max(0, Math.min(100, (clickY / rect.height) * 100))

      updateTextBox(atlasId, draggedBoxId, { x: xPct, y: yPct })
    }
  }

  const handleMouseUp = () => {
    setIsPanning(false)
    setDraggedPinId(null)
    setDraggedBoxId(null)
  }

  // ── Placement Click Handler ──
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (editMode !== 'edit' || isPanning || draggedPinId || draggedBoxId) return
    if (e.target !== e.currentTarget && !(e.target as HTMLElement).classList.contains('atlas-overlay')) return

    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top
    const xPct = (clickX / rect.width) * 100
    const yPct = (clickY / rect.height) * 100

    setFocusedTextBoxId(null)
    setEditingPin(null)

    if (activeTool === 'pin' || activeTool === 'subatlas') {
      setPopoverCoords({ x: xPct, y: yPct })
    } else if (activeTool === 'text') {
      const box = addTextBox(atlasId, xPct, yPct)
      setFocusedTextBoxId(box.id)
      setActiveTool('pan') // revert to pan selection mode
    }
  }

  // ── Pin Configuration Submissions ──
  const handleCreatePinCommit = (label: string, targetId: string, colorHex: string) => {
    if (popoverCoords) {
      addPin(atlasId, label, popoverCoords.x, popoverCoords.y, targetId, colorHex)
      setPopoverCoords(null)
    }
  }

  const handleUpdatePinCommit = (label: string, targetId: string, colorHex: string) => {
    if (editingPin) {
      updatePin(atlasId, editingPin.id, { label, targetId, colorHex })
      setEditingPin(null)
    }
  }

  const handleDeletePinCommit = () => {
    if (editingPin) {
      removePin(atlasId, editingPin.id)
      setEditingPin(null)
    }
  }

  // ── Pin Dragging Down Event ──
  const handlePinMouseDown = (e: React.MouseEvent, pin: Pin) => {
    if (editMode !== 'edit') return
    e.stopPropagation() // stop panning
    setPopoverCoords(null)
    setEditingPin(null)
    setFocusedTextBoxId(null)
    setDraggedPinId(pin.id)
  }

  // ── Pin Navigation (Preview Mode Double Click) ──
  const handlePinDoubleClick = (e: React.MouseEvent, pin: Pin) => {
    if (editMode !== 'preview') return
    e.stopPropagation()

    const target = entries.find((en) => en.id === pin.targetId)
    if (!target) {
      window.alert('The linked page or folder no longer exists.')
      return
    }

    if (target.kind === 'page') {
      navigate(`/page/${target.id}`)
    } else if (target.kind === 'atlas') {
      navigate(`/wiki/${wikiId}/atlas/${target.id}`)
    } else {
      const parentWikiId = findWikiId(target.parentId, entries, wikis)
      navigate(parentWikiId ? `/wiki/${parentWikiId}/folder/${target.id}` : '/')
    }
  }

  // ── Text Box Dragging Event ──
  const handleTextBoxMouseDown = (e: React.MouseEvent, box: TextBox) => {
    if (editMode !== 'edit') return
    // Prevent dragging if editing text inside contentEditable
    const target = e.target as HTMLElement
    if (target.getAttribute('contenteditable') === 'true' || target.closest('[contenteditable="true"]')) {
      return
    }
    e.stopPropagation()
    setPopoverCoords(null)
    setEditingPin(null)
    setFocusedTextBoxId(box.id)
    setDraggedBoxId(box.id)
  }

  const handleTextBoxMouseUp = (e: React.MouseEvent<HTMLDivElement>, box: TextBox) => {
    if (editMode !== 'edit') return
    const el = e.currentTarget
    if (el.clientWidth !== box.width || el.clientHeight !== box.height) {
      updateTextBox(atlasId, box.id, {
        width: el.clientWidth,
        height: el.clientHeight,
      })
    }
  }

  const { textBoxes = [] } = atlas

  return (
    <div
      ref={viewportRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        cursor: isPanning ? 'grabbing' : (activeTool === 'pan' ? 'grab' : 'crosshair'),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
      }}
    >
      {/* ── Empty Map Upload State ── */}
      {!atlas.imagePath ? (
        <div
          className="empty-state"
          style={{
            maxWidth: 440,
            padding: 32,
            border: '2px dashed rgba(255,255,255,0.15)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-menu-panel)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent)' }}>
            <AtlasIcon size={48} style={{ opacity: 0.7 }} />
          </div>
          <div>
            <h3 style={{ fontSize: 18, color: 'var(--color-text)', marginBottom: 6 }}>Initialize Atlas Map</h3>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>
              Select a visual template or upload your own map/blueprint image.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
            <button className="btn--primary" onClick={() => onSelectTemplate('fantasy_map')} style={{ width: '100%', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <AtlasIcon size={16} /> Use Fantasy Map Template
            </button>
            <button className="btn--primary" onClick={() => onSelectTemplate('timeline_template')} style={{ width: '100%', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <TimelineIcon /> Use Chronological Timeline
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>OR</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
            </div>
            <button className="btn--ghost" onClick={onUploadImage} style={{ width: '100%', border: '1px solid rgba(255,255,255,0.15)', margin: 0 }}>
              Choose Custom Image File
            </button>
          </div>
        </div>
      ) : (
        /* ── Canvas workspace ── */
        <div
          className="atlas-canvas"
          style={{
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
            transformOrigin: 'center center',
            transition: isPanning || draggedPinId || draggedBoxId ? 'none' : 'transform 0.1s ease',
            display: 'inline-block',
            position: 'relative',
          }}
        >
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img
              ref={imgRef}
              src={imageUrl}
              alt="Atlas Background"
              style={{
                display: 'block',
                maxHeight: '80vh',
                maxWidth: '80vw',
                pointerEvents: 'none',
                userSelect: 'none',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
                border: '1px solid rgba(255,255,255,0.05)',
                backgroundColor: 'rgba(0,0,0,0.2)',
              }}
            />

            {/* Canvas Pins & Text Interaction Overlay */}
            <div
              className="atlas-overlay"
              onClick={handleCanvasClick}
              style={{
                position: 'absolute',
                inset: 0,
                cursor: activeTool !== 'pan' && editMode === 'edit' ? 'crosshair' : 'inherit',
                pointerEvents: 'auto',
              }}
            >
              {/* ── Render Text Boxes ── */}
              {textBoxes.map((box) => {
                const isFocused = box.id === focusedTextBoxId
                return (
                  <div
                    key={box.id}
                    onMouseDown={(e) => handleTextBoxMouseDown(e, box)}
                    onMouseUp={(e) => handleTextBoxMouseUp(e, box)}
                    style={{
                      position: 'absolute',
                      left: `${box.x}%`,
                      top: `${box.y}%`,
                      width: box.width,
                      height: box.height,
                      border: editMode === 'edit'
                        ? (isFocused ? '1.5px solid var(--color-primary)' : '1px dashed rgba(255,255,255,0.25)')
                        : 'none',
                      boxSizing: 'border-box',
                      resize: editMode === 'edit' ? 'both' : 'none',
                      overflow: 'hidden',
                      cursor: editMode === 'edit' ? (draggedBoxId === box.id ? 'grabbing' : 'grab') : 'default',
                      zIndex: isFocused ? 150 : 90,
                      background: editMode === 'edit' ? 'rgba(0,0,0,0.18)' : 'transparent',
                      padding: '4px 6px',
                    }}
                  >
                    <div
                      contentEditable={editMode === 'edit'}
                      suppressContentEditableWarning
                      onBlur={(e) => {
                        updateTextBox(atlasId, box.id, { text: e.currentTarget.textContent || '' })
                      }}
                      onFocus={() => {
                        setFocusedTextBoxId(box.id)
                      }}
                      style={{
                        fontFamily: box.fontFamily === 'inherit' ? 'inherit' : box.fontFamily,
                        fontSize: `${box.fontSize}px`,
                        fontWeight: box.bold ? 'bold' : 'normal',
                        fontStyle: box.italic ? 'italic' : 'normal',
                        textDecoration: box.underline ? 'underline' : 'none',
                        color: box.colorHex,
                        outline: 'none',
                        width: '100%',
                        height: '100%',
                        overflow: 'hidden',
                        wordBreak: 'break-word',
                        cursor: editMode === 'edit' ? 'text' : 'default',
                        userSelect: editMode === 'edit' ? 'text' : 'none',
                      }}
                    >
                      {box.text}
                    </div>

                    {/* Delete button (Edit Mode only, when focused) */}
                    {editMode === 'edit' && isFocused && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeTextBox(atlasId, box.id)
                          setFocusedTextBoxId(null)
                        }}
                        style={{
                          position: 'absolute',
                          top: -6,
                          right: -6,
                          background: '#f43f5e',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: 15,
                          height: 15,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 9,
                          cursor: 'pointer',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                          zIndex: 200,
                          padding: 0,
                          fontWeight: 'bold',
                        }}
                        title="Delete text box"
                      >
                        ×
                      </button>
                    )}
                  </div>
                )
              })}

              {/* ── Render Pins (Always-Visible Text Pins) ── */}
              {atlas.pins.map((pin) => {
                const isHovered = hoveredPinId === pin.id
                const isEditing = editingPin?.id === pin.id
                return (
                  <div
                    key={pin.id}
                    onMouseDown={(e) => handlePinMouseDown(e, pin)}
                    onDoubleClick={(e) => handlePinDoubleClick(e, pin)}
                    onClick={(e) => {
                      if (editMode === 'edit') {
                        e.stopPropagation()
                        setPopoverCoords(null)
                        setEditingPin(pin)
                      }
                    }}
                    onMouseEnter={() => setHoveredPinId(pin.id)}
                    onMouseLeave={() => setHoveredPinId(null)}
                    style={{
                      position: 'absolute',
                      left: `${pin.x}%`,
                      top: `${pin.y}%`,
                      transform: 'translate(-50%, -50%)',
                      cursor: editMode === 'edit' ? 'move' : 'pointer',
                      zIndex: isEditing ? 200 : 100,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {/* Pin Dot (Toggleable) */}
                    {showPins && (() => {
                      const targetEntry = entries.find((e) => e.id === pin.targetId)
                      const isSubAtlas = targetEntry?.kind === 'atlas'
                      return isSubAtlas ? (
                        <div
                          style={{
                            fontSize: 16,
                            zIndex: 10,
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
                          }}
                        >
                           <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#8E92FF' }}>
                             <AtlasIcon size={16} />
                           </span>
                        </div>
                      ) : (
                        <div
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: pin.colorHex,
                            border: '2px solid white',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
                            zIndex: 10,
                            flexShrink: 0,
                          }}
                        />
                      )
                    })()}

                    {/* Always-visible Label */}
                    <div
                      style={{
                        marginLeft: showPins ? 8 : 0, // offset right if dot is visible
                        padding: '3px 8px',
                        borderRadius: 4,
                        background: isHovered || isEditing ? 'rgba(15, 23, 42, 0.92)' : 'rgba(15, 23, 42, 0.72)',
                        border: isHovered || isEditing
                          ? `1px solid ${pin.colorHex}`
                          : '1px solid rgba(255, 255, 255, 0.08)',
                        color: '#ffffff',
                        fontSize: 10.5,
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.35)',
                        transform: showPins ? 'none' : 'translateX(-50%)', // center if dot is gone
                        position: showPins ? 'relative' : 'absolute',
                        left: showPins ? 0 : '50%',
                      }}
                    >
                      {pin.label}
                    </div>
                  </div>
                )
              })}

              {/* ── Popover: Create Pin / Sub-Atlas ── */}
              {popoverCoords && (
                activeTool === 'subatlas' ? (
                  <SubAtlasPopover
                    x={popoverCoords.x}
                    y={popoverCoords.y}
                    parentAtlasId={atlasId}
                    wikiId={wikiId}
                    onConfirm={handleCreatePinCommit}
                    onCancel={() => setPopoverCoords(null)}
                  />
                ) : (
                  <PinPopover
                    x={popoverCoords.x}
                    y={popoverCoords.y}
                    onConfirm={handleCreatePinCommit}
                    onCancel={() => setPopoverCoords(null)}
                  />
                )
              )}

              {/* ── Popover: Edit Pin / Sub-Atlas ── */}
              {editingPin && (() => {
                const targetEntry = entries.find((e) => e.id === editingPin.targetId)
                const isSubAtlas = targetEntry?.kind === 'atlas'
                return isSubAtlas ? (
                  <SubAtlasPopover
                    x={editingPin.x}
                    y={editingPin.y}
                    parentAtlasId={atlasId}
                    wikiId={wikiId}
                    initialLabel={editingPin.label}
                    initialTargetId={editingPin.targetId}
                    initialColorHex={editingPin.colorHex}
                    onConfirm={handleUpdatePinCommit}
                    onCancel={() => setEditingPin(null)}
                    onDelete={handleDeletePinCommit}
                  />
                ) : (
                  <PinPopover
                    x={editingPin.x}
                    y={editingPin.y}
                    initialLabel={editingPin.label}
                    initialTargetId={editingPin.targetId}
                    initialColorHex={editingPin.colorHex}
                    onConfirm={handleUpdatePinCommit}
                    onCancel={() => setEditingPin(null)}
                    onDelete={handleDeletePinCommit}
                  />
                )
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AtlasCanvas
