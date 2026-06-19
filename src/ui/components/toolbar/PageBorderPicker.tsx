/**
 * PageBorderPicker — per-page border customization dropdown.
 * Controls: border style, color, width (px), radius (px).
 * Persists via useAttrStore.setPageStyle → saved with the page file.
 */

import React, { useRef, useState, useEffect } from 'react'
import { useAttrStore } from '../../../stores/useAttrStore'
import type { PageStyle } from '../../../stores/useAttrStore'
import ColorPicker from './ColorPicker'

interface PageBorderPickerProps {
  pageId:  string
  onClose: () => void
}

type BorderStyleOption = PageStyle['borderStyle']
const BORDER_STYLES: BorderStyleOption[] = ['none', 'solid', 'dashed', 'dotted', 'double']

const DEFAULT_STYLE: PageStyle = {
  borderColor:  '#6366f1',
  borderWidth:  2,
  borderStyle:  'solid',
  borderRadius: 8,
}

const PageBorderPicker: React.FC<PageBorderPickerProps> = ({ pageId, onClose }) => {
  const { getPage, setPageStyle } = useAttrStore()
  const current = getPage(pageId).pageStyle ?? DEFAULT_STYLE
  const [showColor, setShowColor] = useState(false)
  const colorWrapRef = useRef<HTMLDivElement>(null)

  // Close color sub-picker on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (showColor && colorWrapRef.current && !colorWrapRef.current.contains(e.target as Node)) {
        setShowColor(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showColor])

  const update = (patch: Partial<PageStyle>) => {
    const next = { ...current, ...patch }
    // If switching to 'none', clear the border entirely
    setPageStyle(pageId, next.borderStyle === 'none' ? { ...next, borderWidth: 0 } : next)
  }

  const isBorderNone = current.borderStyle === 'none' || current.borderWidth === 0

  return (
    <div className="fmt-dropdown page-border-picker">
      <div className="page-border-picker__label">Page Border</div>

      {/* Style row */}
      <div className="page-border-picker__row">
        {BORDER_STYLES.map((s) => (
          <button
            key={s}
            className={`page-border-picker__style-btn${current.borderStyle === s ? ' page-border-picker__style-btn--active' : ''}`}
            onClick={() => update({ borderStyle: s })}
            title={s}
          >
            {s}
          </button>
        ))}
      </div>

      {!isBorderNone && (
        <>
          {/* Color */}
          <div className="page-border-picker__section-label">Color</div>
          <div className="fmt-dropdown-wrap" ref={colorWrapRef}>
            <button
              className="page-border-picker__color-btn"
              style={{ background: current.borderColor }}
              onClick={() => setShowColor((v) => !v)}
            />
            {showColor && (
              <ColorPicker
                value={current.borderColor}
                onChange={(hex) => update({ borderColor: hex })}
                onClose={() => setShowColor(false)}
              />
            )}
          </div>

          {/* Width slider */}
          <div className="page-border-picker__section-label">
            Width — {current.borderWidth}px
          </div>
          <input
            type="range" min={1} max={8} value={current.borderWidth}
            className="page-border-picker__slider"
            onChange={(e) => update({ borderWidth: Number(e.target.value) })}
          />

          {/* Radius slider */}
          <div className="page-border-picker__section-label">
            Radius — {current.borderRadius}px
          </div>
          <input
            type="range" min={0} max={24} value={current.borderRadius}
            className="page-border-picker__slider"
            onChange={(e) => update({ borderRadius: Number(e.target.value) })}
          />
        </>
      )}

      <div className="page-border-picker__divider" />
      <button className="page-border-picker__reset" onClick={() => { setPageStyle(pageId, undefined); onClose() }}>
        Reset to default
      </button>
    </div>
  )
}

export default PageBorderPicker
