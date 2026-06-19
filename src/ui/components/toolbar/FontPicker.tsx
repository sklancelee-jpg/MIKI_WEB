/**
 * FontPicker — font family selector with custom font upload.
 * Built-in fonts listed first, then user-installed custom fonts,
 * then an "Import font" button that triggers the Tauri file dialog.
 */

import React, { useState } from 'react'
import { useFontStore }  from '../../../stores/useFontStore'
import { installFont }   from '../../../services/fontManager'
import { logError }      from '../../../utils/logger'

interface FontPickerProps {
  value:    string   // current CSS font-family
  onChange: (fontFamily: string) => void
  onClose:  () => void
}

const BUILT_IN_FONTS = [
  { label: 'Default',          value: 'inherit'         },
  { label: 'Georgia',          value: 'Georgia'         },
  { label: 'Palatino',         value: 'Palatino'        },
  { label: 'Times New Roman',  value: 'Times New Roman' },
  { label: 'Arial',            value: 'Arial'           },
  { label: 'Helvetica',        value: 'Helvetica'       },
  { label: 'Courier New',      value: 'Courier New'     },
]

const FontPicker: React.FC<FontPickerProps> = ({ value, onChange, onClose }) => {
  const { fonts } = useFontStore()
  const [uploading, setUploading] = useState(false)

  const select = (fontFamily: string) => { onChange(fontFamily); onClose() }

  const handleUpload = async () => {
    setUploading(true)
    try {
      const entry = await installFont()
      if (entry) select(entry.name)
    } catch (err) {
      logError({ error_code: 'FONT_UPLOAD_FAILED', description: 'font import failed', context_payload: { err: String(err) } })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fmt-dropdown font-picker">
      {/* Built-in fonts */}
      <div className="font-picker__section">Built-in</div>
      {BUILT_IN_FONTS.map((f) => (
        <button key={f.value}
          className={`fmt-dropdown__item${value === f.value ? ' fmt-dropdown__item--active' : ''}`}
          style={{ fontFamily: f.value }}
          onClick={() => select(f.value)}>
          {f.label}
        </button>
      ))}

      {/* Custom fonts */}
      {fonts.length > 0 && (
        <>
          <div className="font-picker__section font-picker__section--border">Custom</div>
          {fonts.map((f) => (
            <button key={f.id}
              className={`fmt-dropdown__item${value === f.name ? ' fmt-dropdown__item--active' : ''}`}
              style={{ fontFamily: f.name }}
              onClick={() => select(f.name)}>
              {f.name}
            </button>
          ))}
        </>
      )}

      {/* Import button */}
      <div className="font-picker__section font-picker__section--border" />
      <button className="font-picker__upload" onClick={handleUpload} disabled={uploading}>
        {uploading ? 'Importing…' : '+ Import font (.ttf  .otf  .woff2)'}
      </button>
    </div>
  )
}

export default FontPicker
