/**
 * AtlasLeftPanel — hierarchical map directory tree (collapsible).
 * Displays nested sub-atlases (Ancestors ➔ Current ➔ Descendants).
 */

import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useDirStore, type DirEntry } from '../../../stores/useDirStore'
import { useWikiStore } from '../../../stores/useWikiStore'
import { AtlasIcon } from '../shared/Icons'

interface AtlasLeftPanelProps {
  open: boolean
  onToggle: () => void
  currentAtlasId: string
  wikiId: string
}

interface TreeNode {
  id: string
  name: string
  children: TreeNode[]
  level: number
}

const AtlasLeftPanel: React.FC<AtlasLeftPanelProps> = ({
  open,
  onToggle,
  currentAtlasId,
  wikiId,
}) => {
  const navigate = useNavigate()
  const { entries } = useDirStore()
  const { wikis } = useWikiStore()

  const wiki = wikis.find((w) => w.id === wikiId)
  const activeColor = wiki?.colorHex ?? '#6366f1' // fallback to primary indigo

  // 1. Locate the top-most root atlas in the current ancestry chain
  let rootAtlas = entries.find((e) => e.id === currentAtlasId)
  while (rootAtlas && rootAtlas.parentId) {
    const parent = entries.find((e) => e.id === rootAtlas!.parentId)
    if (parent && parent.kind === 'atlas') {
      rootAtlas = parent
    } else {
      break
    }
  }

  // 2. Build the nested tree node recursively
  const buildNode = (entry: DirEntry, level: number): TreeNode => {
    const children = entries
      .filter((e) => e.parentId === entry.id && e.kind === 'atlas')
      .map((e) => buildNode(e, level + 1))
    return {
      id: entry.id,
      name: entry.name,
      children,
      level,
    }
  }

  const rootNode = rootAtlas ? buildNode(rootAtlas, 1) : null

  // 3. Render a single tree node recursively
  const renderNode = (node: TreeNode) => {
    const isCurrent = node.id === currentAtlasId

    return (
      <React.Fragment key={node.id}>
        <div
          className={`toc__row toc__row--h${Math.min(node.level, 3)}`}
          style={{
            paddingLeft: (node.level - 1) * 12,
            display: 'flex',
            alignItems: 'center',
            background: isCurrent ? 'rgba(255,255,255,0.03)' : 'transparent',
            borderRadius: 'var(--radius-sm)',
            borderLeft: isCurrent ? `3px solid ${activeColor}` : '3px solid transparent',
          }}
        >
          <span style={{ fontSize: 12, marginLeft: 6, marginRight: 6, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <AtlasIcon size={12} />
          </span>
          <button
            className={`toc__item toc__item--leaf`}
            style={{
              paddingLeft: 4,
              fontWeight: isCurrent ? 600 : 400,
              color: isCurrent ? '#ffffff' : 'var(--color-text-muted)',
              textAlign: 'left',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: 12.5,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              width: '100%',
              display: 'block',
            }}
            onClick={() => {
              if (node.id !== currentAtlasId) {
                navigate(`/wiki/${wikiId}/atlas/${node.id}`)
              }
            }}
            title={node.name}
          >
            {node.name}
          </button>
        </div>
        {node.children.map(renderNode)}
      </React.Fragment>
    )
  }

  return (
    <aside className={`panel panel--left${open ? '' : ' panel--collapsed'}`}>
      <button
        className="panel__toggle panel__toggle--left"
        onClick={onToggle}
        aria-label={open ? 'Collapse map directory' : 'Expand map directory'}
        title={open ? 'Collapse' : 'Expand'}
      >
        {open ? '◀' : '▶'}
      </button>

      {open && (
        <div className="panel__content">
          <h3 className="panel__heading">Map Directory</h3>
          {!rootNode ? (
            <p className="panel__empty">No maps in this directory.</p>
          ) : (
            <nav className="toc" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {renderNode(rootNode)}
            </nav>
          )}
        </div>
      )}
    </aside>
  )
}

export default AtlasLeftPanel
