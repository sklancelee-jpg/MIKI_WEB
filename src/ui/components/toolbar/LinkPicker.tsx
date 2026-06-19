/**
 * LinkPicker — dropdown for creating internal page/folder links.
 * Appears when the user clicks the Link button in ToolbarCenter with text selected.
 * Searches all entries across all wikis, shows: icon | name | path.
 * On confirm, applies the InternalLink mark to the editor selection.
 */

import React, { useState, useEffect, useRef } from 'react'
import type { Editor } from '@tiptap/core'
import { useWikiStore } from '../../../stores/useWikiStore'
import { useDirStore }  from '../../../stores/useDirStore'
import { search, type SearchResult, type ResultKind } from '../../../services/searchService'
import type { InternalLinkAttrs, LinkTargetKind } from '../editor/InternalLinkExtension'

interface LinkPickerProps {
  editor:  Editor
  onClose: () => void
}

import { WikiIcon, FolderIcon, PageIcon, AtlasIcon } from '../shared/Icons'

const KindIcon: React.FC<{ kind: ResultKind; size?: number }> = ({ kind, size = 15 }) => {
  if (kind === 'wiki') return <WikiIcon size={size} />
  if (kind === 'folder') return <FolderIcon size={size} />
  if (kind === 'page') return <PageIcon size={size} />
  if (kind === 'atlas') return <AtlasIcon size={size} />
  return null
}

const LinkPicker: React.FC<LinkPickerProps> = ({ editor, onClose }) => {
  const { wikis }   = useWikiStore()
  const { entries } = useDirStore()

  const [query,     setQuery]     = useState('')
  const [results,   setResults]   = useState<SearchResult[]>([])
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input on mount
  useEffect(() => { inputRef.current?.focus() }, [])

  // Filter out wikis — can only link to pages and folders
  useEffect(() => {
    const all = search(query, wikis, entries, 10)
    setResults(all.filter((r) => r.kind !== 'wiki'))
    setActiveIdx(0)
  }, [query, wikis, entries])

  const confirm = (r: SearchResult) => {
    const attrs: InternalLinkAttrs = {
      targetId:   r.id,
      targetKind: r.kind as LinkTargetKind,
      targetName: r.name,
    }
    editor.chain().focus().setInternalLink(attrs).run()
    onClose()
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown')  { e.preventDefault(); setActiveIdx((i) => (i + 1) % Math.max(1, results.length)) }
    if (e.key === 'ArrowUp')    { e.preventDefault(); setActiveIdx((i) => (i + Math.max(1, results.length) - 1) % Math.max(1, results.length)) }
    if (e.key === 'Enter' && results[activeIdx]) { e.preventDefault(); confirm(results[activeIdx]) }
    if (e.key === 'Escape')     { onClose() }
  }

  const isLinkActive = editor.isActive('internalLink')

  return (
    <div className="fmt-dropdown link-picker">
      <div className="link-picker__header">
        <span className="link-picker__label">Link to</span>
        {isLinkActive && (
          <button
            className="link-picker__remove"
            onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().unsetInternalLink().run(); onClose() }}
          >
            Remove link
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        className="link-picker__input"
        type="text"
        placeholder="Search pages and folders…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKey}
      />

      <div className="link-picker__results">
        {results.length === 0 ? (
          <div className="link-picker__empty">
            {query ? `No results for "${query}"` : 'Start typing to search…'}
          </div>
        ) : (
          results.map((r, i) => (
            <button
              key={r.id}
              className={`search-result${i === activeIdx ? ' search-result--active' : ''}`}
              onMouseEnter={() => setActiveIdx(i)}
              onMouseDown={(e) => { e.preventDefault(); confirm(r) }}
            >
              <span className="search-result__icon"><KindIcon kind={r.kind} /></span>
              <span className="search-result__body">
                <span className="search-result__name">{r.name}</span>
                {r.path && <span className="search-result__path">{r.path}</span>}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  )
}

export default LinkPicker
