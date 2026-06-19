/**
 * colorUtils — derive gradient/shadow values from a base hex color.
 * Used by WikiCard, FolderCard, and PageCard for the glossy tile look.
 */

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, Math.round(l * 100)]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === r)      h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) h = ((b - r) / d + 2) / 6
  else                h = ((r - g) / d + 4) / 6
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return '#' + [f(0), f(8), f(4)]
    .map((x) => Math.round(x * 255).toString(16).padStart(2, '0'))
    .join('')
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** 3-stop diagonal gradient: light → base → dark. */
export function tileGradient(hex: string): string {
  const [h, s, l] = hexToHsl(hex)
  const light = hslToHex(h, clamp(s + 12, 0, 100), clamp(l + 22, 0, 90))
  const dark  = hslToHex(h, clamp(s + 5,  0, 100), clamp(l - 28, 5, 100))
  return `linear-gradient(158deg, ${light} 0%, ${hex} 46%, ${dark} 100%)`
}

/** Lighter variant of the color (for folder tab gradient top stop). */
export function tileLightColor(hex: string): string {
  const [h, s, l] = hexToHsl(hex)
  return hslToHex(h, clamp(s + 12, 0, 100), clamp(l + 22, 0, 90))
}

/** Box shadow with deep drop shadow + color-tinted inset bottom glow. */
export function tileShadow(hex: string): string {
  const [h, s, l] = hexToHsl(hex)
  const sh = hslToHex(h, clamp(s + 5, 0, 100), clamp(l - 32, 5, 100))
  const [r, g, b] = sh.slice(1).match(/.{2}/g)!.map((x) => parseInt(x, 16))
  return [
    '0 12px 24px -6px rgba(0,0,0,.55)',
    '0 3px 6px rgba(0,0,0,.4)',
    'inset 0 1.5px 0 rgba(255,255,255,.55)',
    `inset 0 -10px 18px rgba(${r},${g},${b},.4)`,
  ].join(', ')
}
