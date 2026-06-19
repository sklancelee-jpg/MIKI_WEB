/**
 * ColorWheelPicker — canvas-based HSV color picker.
 * Saturation/value gradient square + hue slider + hex input.
 * onChange fires immediately on every interaction (no confirm button).
 */

import React, { useState, useRef, useEffect } from 'react'

// ── HSV ↔ hex ─────────────────────────────────────────────────
function hsvToHex(h: number, s: number, v: number): string {
  const f = (n: number) => {
    const k = (n + h / 60) % 6
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1))
  }
  const x = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0')
  return `#${x(f(5))}${x(f(3))}${x(f(1))}`
}

function hexToHsv(hex: string): [number, number, number] {
  const c = hex.replace('#', '')
  if (!/^[0-9a-fA-F]{6}$/.test(c)) return [0, 0, 1]
  const r = parseInt(c.slice(0, 2), 16) / 255
  const g = parseInt(c.slice(2, 4), 16) / 255
  const b = parseInt(c.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min
  let h = 0
  if (d !== 0) {
    if (max === r)      h = ((g - b) / d + 6) % 6
    else if (max === g) h = (b - r) / d + 2
    else                h = (r - g) / d + 4
    h *= 60
  }
  return [h, max > 0 ? d / max : 0, max]
}

const SV_W = 220, SV_H = 148, HUE_H = 14

interface Props {
  value:    string
  onChange: (hex: string) => void
}

const ColorWheelPicker: React.FC<Props> = ({ value, onChange }) => {
  const [hue, setHue] = useState(() => hexToHsv(value)[0])
  const [sat, setSat] = useState(() => hexToHsv(value)[1])
  const [val, setVal] = useState(() => hexToHsv(value)[2])
  const [hex, setHex] = useState(value.replace('#', '').toUpperCase())

  const svRef   = useRef<HTMLCanvasElement>(null)
  const hueRef  = useRef<HTMLCanvasElement>(null)
  const dragging = useRef<'sv' | 'hue' | null>(null)

  // Sync when external value changes
  useEffect(() => {
    const [h, s, v] = hexToHsv(value)
    setHue(h); setSat(s); setVal(v)
    setHex(value.replace('#', '').toUpperCase())
  }, [value])

  // Redraw SV gradient on hue change
  useEffect(() => {
    const c = svRef.current; if (!c) return
    const ctx = c.getContext('2d')!
    const gH = ctx.createLinearGradient(0, 0, SV_W, 0)
    gH.addColorStop(0, '#fff')
    gH.addColorStop(1, `hsl(${hue}, 100%, 50%)`)
    ctx.fillStyle = gH; ctx.fillRect(0, 0, SV_W, SV_H)
    const gV = ctx.createLinearGradient(0, 0, 0, SV_H)
    gV.addColorStop(0, 'transparent')
    gV.addColorStop(1, '#000')
    ctx.fillStyle = gV; ctx.fillRect(0, 0, SV_W, SV_H)
  }, [hue])

  // Draw hue rainbow once
  useEffect(() => {
    const c = hueRef.current; if (!c) return
    const ctx = c.getContext('2d')!
    const g = ctx.createLinearGradient(0, 0, SV_W, 0)
    ;[0, 60, 120, 180, 240, 300, 360].forEach((deg, i) =>
      g.addColorStop(i / 6, `hsl(${deg}, 100%, 50%)`)
    )
    ctx.fillStyle = g; ctx.fillRect(0, 0, SV_W, HUE_H)
  }, [])

  const emitHsv = (nh: number, ns: number, nv: number) => {
    const color = hsvToHex(nh, ns, nv)
    setHex(color.replace('#', '').toUpperCase())
    onChange(color)
  }

  const pickSv = (e: MouseEvent) => {
    const c = svRef.current; if (!c) return
    const r = c.getBoundingClientRect()
    const ns = Math.max(0, Math.min(1, (e.clientX - r.left) / SV_W))
    const nv = Math.max(0, Math.min(1, 1 - (e.clientY - r.top) / SV_H))
    setSat(ns); setVal(nv); emitHsv(hue, ns, nv)
  }

  const pickHue = (e: MouseEvent) => {
    const c = hueRef.current; if (!c) return
    const r = c.getBoundingClientRect()
    const nh = Math.max(0, Math.min(360, ((e.clientX - r.left) / SV_W) * 360))
    setHue(nh); emitHsv(nh, sat, val)
  }

  // Drag handlers (re-registers on value change to avoid stale closures)
  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (dragging.current === 'sv')  pickSv(e)
      if (dragging.current === 'hue') pickHue(e)
    }
    const up = () => { dragging.current = null }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }
  }, [hue, sat, val]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleHexInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6).toUpperCase()
    setHex(v)
    if (v.length === 6) {
      const [nh, ns, nv] = hexToHsv(`#${v}`)
      setHue(nh); setSat(ns); setVal(nv)
      onChange(`#${v}`)
    }
  }

  const previewColor = hsvToHex(hue, sat, val)

  return (
    <div className="cwp">
      {/* ── Saturation / Value gradient ── */}
      <div className="cwp__sv-wrap"
        onMouseDown={(e) => { dragging.current = 'sv'; pickSv(e.nativeEvent) }}>
        <canvas ref={svRef} className="cwp__sv" width={SV_W} height={SV_H} />
        <div className="cwp__cursor" style={{ left: sat * SV_W, top: (1 - val) * SV_H }} />
      </div>

      {/* ── Hue slider ── */}
      <div className="cwp__hue-wrap"
        onMouseDown={(e) => { dragging.current = 'hue'; pickHue(e.nativeEvent) }}>
        <canvas ref={hueRef} className="cwp__hue" width={SV_W} height={HUE_H} />
        <div className="cwp__hue-thumb" style={{ left: (hue / 360) * SV_W }} />
      </div>

      {/* ── Preview + Hex input ── */}
      <div className="cwp__hex-row">
        <div className="cwp__preview" style={{ background: previewColor }} />
        <span className="cwp__hash">#</span>
        <input
          className="cwp__hex-input"
          value={hex}
          onChange={handleHexInput}
          onKeyDown={(e) => { if (e.key === 'Enter' && hex.length === 6) onChange(`#${hex}`) }}
          maxLength={6} placeholder="RRGGBB" spellCheck={false}
        />
      </div>
    </div>
  )
}

export default ColorWheelPicker
