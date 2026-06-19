/**
 * PageView — three-panel writing environment.
 * Creates the Tiptap editor instance and distributes it to Toolbar + panels.
 * Re-renders on every editor transaction → toolbar format state stays in sync.
 */

import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { listen } from '@tauri-apps/api/event'
import { useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Heading from '@tiptap/extension-heading'
import Underline from '@tiptap/extension-underline'
import TextStyle from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import FontFamily from '@tiptap/extension-font-family'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'

import Toolbar from '../components/toolbar/Toolbar'
import LeftPanel from '../components/panels/LeftPanel'
import RightPanel from '../components/panels/RightPanel'
import MikiEditor from '../components/editor/MikiEditor'
import { SlashCommandExtension } from '../components/editor/SlashCommandExtension'
import { FontSizeExtension }     from '../components/editor/FontSizeExtension'
import { StyledHRExtension }     from '../components/editor/StyledHRExtension'
import { InternalLinkExtension } from '../components/editor/InternalLinkExtension'
import { WikiLinkCommandExtension } from '../components/editor/WikiLinkCommandExtension'
import { CalloutExtension }      from '../components/editor/CalloutExtension'
import { LineHeightExtension }   from '../components/editor/LineHeightExtension'
import { usePageViewStore } from '../../stores/usePageViewStore'
import { useDirStore }      from '../../stores/useDirStore'
import { useWikiStore }     from '../../stores/useWikiStore'
import { useNavStore }      from '../../stores/useNavStore'
import { useContentStore }  from '../../stores/useContentStore'
import { useAttrStore }     from '../../stores/useAttrStore'
import { findWikiId }       from '../../services/searchService'
import { flushPage }        from '../../services/dataLoader'
import { parseHeadingTree } from '../../services/parseHeadingTree'
import { exportPage, type ExportFormat } from '../../services/exportService'
import type { TocItem } from '../components/panels/LeftPanel'

const PageView: React.FC = () => {
  const { pageId }  = useParams<{ pageId: string }>()
  const { entries } = useDirStore()
  const page        = entries.find((e) => e.id === pageId && e.kind === 'page')

  const {
    leftPanelOpen, rightPanelOpen, editMode,
    toggleLeftPanel, toggleRightPanel, setEditMode,
  } = usePageViewStore()
  const { push }         = useNavStore()
  const navigate         = useNavigate()
  const storedContent    = useContentStore((s) => s.getContent(pageId ?? ''))
  const pageStyle        = useAttrStore((s) => s.getPage(pageId ?? '').pageStyle)
  // wikis intentionally not subscribed here — handlePaperClick reads store state at click time

  // Push this page to nav history so back button shows its label
  React.useEffect(() => {
    if (pageId && page) push({ path: `/page/${pageId}`, label: page.name })
  }, [pageId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync window/document title with current page name
  React.useEffect(() => {
    if (page) {
      document.title = `${page.name} — MIKI`
    }
    return () => {
      document.title = 'MIKI'
    }
  }, [page])

  // Debounced page save — runs 800ms after the last editor change
  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const scheduleSave = React.useCallback((json: Parameters<typeof flushPage>[1]) => {
    if (!pageId) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => flushPage(pageId, json), 800)
  }, [pageId]) // eslint-disable-line react-hooks/exhaustive-deps

  const [tocItems, setTocItems] = useState<TocItem[]>([])

  // Internal link navigation — preview mode only.
  // Both entries and wikis are read from store state at click time (not from closure)
  // so renamed or newly-added wikis are always resolved correctly.
  const handlePaperClick = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (editMode === 'edit') return
    const target = (e.target as Element).closest('[data-internal-link]')
    if (!target) return
    e.preventDefault()

    const targetId   = target.getAttribute('data-target-id')
    const targetKind = target.getAttribute('data-target-kind')
    const targetName = target.getAttribute('data-target-name') ?? 'Unknown'
    if (!targetId) return

    const allEntries = useDirStore.getState().entries
    const allWikis   = useWikiStore.getState().wikis  // read at call time, not from closure
    const entry = allEntries.find((en) => en.id === targetId)

    if (!entry) {
      // Broken link — target was deleted
      window.alert(`"${targetName}" no longer exists in this wiki.`)
      return
    }

    if (targetKind === 'page') {
      navigate(`/page/${targetId}`)
    } else if (targetKind === 'atlas') {
      const wikiId = findWikiId(entry.parentId, allEntries, allWikis)
      navigate(wikiId ? `/wiki/${wikiId}/atlas/${targetId}` : '/')
    } else {
      const wikiId = findWikiId(entry.parentId, allEntries, allWikis)
      navigate(wikiId ? `/wiki/${wikiId}/folder/${targetId}` : '/')
    }
  }, [editMode, navigate]) // eslint-disable-line react-hooks/exhaustive-deps

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false, horizontalRule: false }),
      Heading.configure({ levels: [1, 2, 3] }),
      Underline,
      TextStyle,
      Color,
      FontFamily,
      FontSizeExtension,
      StyledHRExtension,
      InternalLinkExtension,
      Image.configure({ inline: false, allowBase64: true }),
      Placeholder.configure({ placeholder: 'Start writing, or type / for commands…' }),
      SlashCommandExtension,
      WikiLinkCommandExtension,
      CalloutExtension,
      LineHeightExtension,
    ],
    content:  storedContent ?? undefined,
    editable: editMode === 'edit',
    onUpdate: ({ editor: e }) => {
      const json = e.getJSON()
      setTocItems(parseHeadingTree(json))
      scheduleSave(json)
    },
  })

  // When navigating between pages React Router reuses this component — useEditor
  // only sets content on first mount, so we must manually reload when pageId changes.
  React.useEffect(() => {
    if (!editor || !pageId) return
    // Clear any pending save so the old page's content doesn't overwrite the new page
    if (saveTimer.current) { clearTimeout(saveTimer.current); saveTimer.current = null }
    const content = useContentStore.getState().getContent(pageId)
    // false = don't emit an onUpdate (prevents a spurious scheduleSave)
    editor.commands.setContent(content ?? '', false)
    setTocItems(parseHeadingTree(editor.getJSON()))
  }, [pageId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync editable flag when preview mode toggles
  React.useEffect(() => {
    editor?.setEditable(editMode === 'edit')
  }, [editor, editMode])

  // Listen for File → Export As from the native menu
  React.useEffect(() => {
    if (!editor || !page) return
    const formats: ExportFormat[] = ['pdf', 'rtf', 'txt', 'md']
    const unlisteners = formats.map((fmt) =>
      listen(`menu:export-${fmt}`, () => {
        exportPage({ format: fmt, pageName: page.name, doc: editor.getJSON() })
      }),
    )
    return () => { unlisteners.forEach((p) => void p.then((fn) => fn())) }
  }, [editor, page]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="page-view">
      <Toolbar
        editor={editor}
        pageId={pageId ?? ''}
        editMode={editMode}
        onEditModeChange={setEditMode}
      />

      <div className="page-panels">
        <LeftPanel
          open={leftPanelOpen}
          tocItems={tocItems}
          onToggle={toggleLeftPanel}
          onHeadingClick={(id) => {
            document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
          }}
        />

        <main className={[
          'scriptorium',
          !leftPanelOpen && 'scriptorium--wide-left',
          !rightPanelOpen && 'scriptorium--wide-right',
        ].filter(Boolean).join(' ')}>
          <div
            className="scriptorium__paper"
            onClick={handlePaperClick}
            style={pageStyle && pageStyle.borderStyle !== 'none' ? {
              border:       `${pageStyle.borderWidth}px ${pageStyle.borderStyle} ${pageStyle.borderColor}`,
              borderRadius: `${pageStyle.borderRadius}px`,
            } : undefined}
          >
            {page ? (
              <MikiEditor editor={editor} />
            ) : (
              <p className="scriptorium__placeholder">Page not found.</p>
            )}
          </div>
        </main>

        <RightPanel
          open={rightPanelOpen}
          pageId={pageId ?? ''}
          onToggle={toggleRightPanel}
        />
      </div>
    </div>
  )
}

export default PageView
