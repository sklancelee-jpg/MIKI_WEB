// PageView — three-panel editor shell
// Left: Table of Contents (collapsible)
// Center: Scriptorium body (always visible)
// Right: Attribute table (collapsible)
// Toolbar spans full width above all three panels

import React from 'react'

// TODO Phase 3: wire up toolbar, panel collapse state, Tiptap editor
const PageView: React.FC = () => {
  return (
    <div className="page-view">
      <div className="toolbar">
        <p>Toolbar (Phase 3)</p>
      </div>
      <div className="panels">
        <aside className="panel-left">ToC (Phase 3)</aside>
        <main className="panel-center">Editor (Phase 4)</main>
        <aside className="panel-right">Attributes (Phase 5)</aside>
      </div>
    </div>
  )
}

export default PageView
