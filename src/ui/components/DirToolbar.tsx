/**
 * DirToolbar — sort tabs (Date | Name | Kind) + grid/list view toggle.
 * Sits below the directory header, above the card grid.
 */

import React from 'react'
import { GridIcon, ListIcon } from './shared/Icons'

export type SortKey  = 'date' | 'name' | 'kind'
export type ViewMode = 'grid' | 'list'

interface DirToolbarProps {
  sort: SortKey
  viewMode: ViewMode
  onSortChange: (key: SortKey) => void
  onViewModeChange: (mode: ViewMode) => void
}

const SORT_TABS: { key: SortKey; label: string }[] = [
  { key: 'date', label: 'Date' },
  { key: 'name', label: 'Name' },
  { key: 'kind', label: 'Kind' },
]

const DirToolbar: React.FC<DirToolbarProps> = ({
  sort,
  viewMode,
  onSortChange,
  onViewModeChange,
}) => (
  <div className="dir-toolbar">
    {/* Sort tabs */}
    <div className="dir-toolbar__sort">
      {SORT_TABS.map(({ key, label }) => (
        <button
          key={key}
          className={`sort-tab${sort === key ? ' sort-tab--active' : ''}`}
          onClick={() => onSortChange(key)}
        >
          {label}
        </button>
      ))}
    </div>

    {/* View toggle */}
    <div className="dir-toolbar__view">
      <button
        className={`view-btn${viewMode === 'grid' ? ' view-btn--active' : ''}`}
        onClick={() => onViewModeChange('grid')}
        aria-label="Grid view"
        title="Grid view"
      >
        <GridIcon />
      </button>
      <button
        className={`view-btn${viewMode === 'list' ? ' view-btn--active' : ''}`}
        onClick={() => onViewModeChange('list')}
        aria-label="List view"
        title="List view"
      >
        <ListIcon />
      </button>
    </div>
  </div>
)

export default DirToolbar
