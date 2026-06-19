/**
 * ToolbarLeft — back button (hold 500ms = Go Home dropdown) + search bar.
 * Back button label reads from useNavStore so it shows "← Characters" etc.
 * Search bar queries searchService and renders an inline dropdown.
 */

import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNavStore } from '../../../stores/useNavStore'
import { useDirStore } from '../../../stores/useDirStore'
import SearchBar from '../shared/SearchBar'
import { HomeIcon, ChevronLeftIcon } from '../shared/Icons'

const HOLD_MS = 500

interface ToolbarLeftProps {
  pageId?: string
}

const ToolbarLeft: React.FC<ToolbarLeftProps> = ({ pageId }) => {
  const navigate            = useNavigate()
  const { previous, pop }   = useNavStore()
  const { entries }         = useDirStore()

  const page = pageId ? entries.find((e) => e.id === pageId && e.kind === 'page') : undefined

  const [showHome, setShowHome] = useState(false)
  const holdTimer               = useRef<ReturnType<typeof setTimeout> | null>(null)

  const prevEntry = previous()
  const backLabel = prevEntry?.label ?? ''

  /* ── Back button ── */
  const startHold = () => {
    holdTimer.current = setTimeout(() => setShowHome(true), HOLD_MS)
  }
  const endHold = () => {
    if (holdTimer.current) { clearTimeout(holdTimer.current); holdTimer.current = null }
  }
  const handleBack = () => {
    if (showHome) return
    pop()
    navigate(-1)
  }
  const handleGoHome = () => {
    setShowHome(false)
    navigate('/')
  }

  return (
    <div className="toolbar-left">
      {/* ── Back button ── */}
      <div className="back-btn-wrap">
        <button
          className="back-btn"
          onMouseDown={startHold}
          onMouseUp={endHold}
          onMouseLeave={endHold}
          onClick={handleBack}
          aria-label={backLabel ? `Back to ${backLabel}` : 'Back'}
          title={backLabel ? `Back to ${backLabel}` : 'Back'}
          data-tooltip={backLabel ? `Back to ${backLabel}` : 'Back'}
        >
          <span className="back-btn__arrow" style={{ display: 'inline-flex', alignItems: 'center' }}>
            <ChevronLeftIcon size={16} />
          </span>
          {backLabel && <span className="back-btn__label">{backLabel}</span>}
        </button>

        {showHome && (
          <div className="back-dropdown">
            <button className="back-dropdown__item" onClick={handleGoHome} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <HomeIcon size={14} /> Go Home
            </button>
            <button className="back-dropdown__item" onClick={() => setShowHome(false)}>Cancel</button>
          </div>
        )}
      </div>

      {/* ── Page Name Visual Indicator ── */}
      {page && (
        <div className="toolbar-page-title" title={page.name}>
          <span className="toolbar-page-title__separator">/</span>
          <span className="toolbar-page-title__text">{page.name}</span>
        </div>
      )}

      {/* ── Search bar ── */}
      <SearchBar placeholder="Search everything…" className="toolbar-search-bar" />
    </div>
  )
}

export default ToolbarLeft
