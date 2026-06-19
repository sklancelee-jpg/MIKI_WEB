/**
 * SearchBar — universal search across all wikis, folders, and pages.
 * Shows results as: icon | name | dimmed ancestor path.
 * Keyboard: ↑↓ to move, Enter to confirm, Escape to dismiss.
 * Used in HomeView, DirectoryView header, and PageView toolbar.
 */

import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWikiStore } from '../../../stores/useWikiStore'
import { useDirStore }  from '../../../stores/useDirStore'
import { search, type SearchResult, type ResultKind } from '../../../services/searchService'

interface SearchBarProps {
  placeholder?: string
  className?:   string
}

import { WikiIcon, FolderIcon, PageIcon, AtlasIcon, SearchIcon, CloseIcon } from './Icons'

const KindIcon: React.FC<{ kind: ResultKind; size?: number }> = ({ kind, size = 15 }) => {
  if (kind === 'wiki') return <WikiIcon size={size} />
  if (kind === 'folder') return <FolderIcon size={size} />
  if (kind === 'page') return <PageIcon size={size} />
  if (kind === 'atlas') return <AtlasIcon size={size} />
  return null
}

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search everything…',
  className   = '',
}) => {
  const navigate        = useNavigate()
  const { wikis }       = useWikiStore()
  const { entries }     = useDirStore()

  const [query,      setQuery]      = useState('')
  const [results,    setResults]    = useState<SearchResult[]>([])
  const [open,       setOpen]       = useState(false)
  const [activeIdx,  setActiveIdx]  = useState(0)
  const wrapRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  // Re-run search whenever query or store changes
  useEffect(() => {
    const r = search(query, wikis, entries)
    setResults(r)
    setActiveIdx(0)
    setOpen(query.trim().length > 0)
  }, [query, wikis, entries])

  const select = (r: SearchResult) => {
    setQuery('')
    setOpen(false)
    navigate(r.navigateTo)
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (!open || !results.length) return
    if (e.key === 'ArrowDown')  { e.preventDefault(); setActiveIdx((i) => (i + 1) % results.length) }
    if (e.key === 'ArrowUp')    { e.preventDefault(); setActiveIdx((i) => (i + results.length - 1) % results.length) }
    if (e.key === 'Enter')      { e.preventDefault(); select(results[activeIdx]) }
    if (e.key === 'Escape')     { setOpen(false) }
  }

  return (
    <div ref={wrapRef} className={`search-bar${open ? ' search-bar--open' : ''}${className ? ` ${className}` : ''}`}>
      <span className="search-bar__icon"><SearchIcon size={15} /></span>
      <input
        className="search-bar__input"
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => { if (query.trim()) setOpen(true) }}
        onKeyDown={handleKey}
        aria-label="Search"
        aria-expanded={open}
        aria-autocomplete="list"
      />
      {query && (
        <button className="search-bar__clear" onClick={() => { setQuery(''); setOpen(false) }} aria-label="Clear">
          <CloseIcon size={14} />
        </button>
      )}

      {open && (
        <div className="search-bar__dropdown" role="listbox">
          {results.length === 0 ? (
            <div className="search-bar__empty">No results for "{query}"</div>
          ) : (
            results.map((r, i) => (
              <button
                key={r.id}
                role="option"
                aria-selected={i === activeIdx}
                className={`search-result${i === activeIdx ? ' search-result--active' : ''}`}
                onMouseEnter={() => setActiveIdx(i)}
                onMouseDown={(e) => { e.preventDefault(); select(r) }}
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
      )}
    </div>
  )
}

export default SearchBar
