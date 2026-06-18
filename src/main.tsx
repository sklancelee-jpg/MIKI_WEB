import React from 'react'
import ReactDOM from 'react-dom/client'
import HomeView from './ui/views/HomeView'

// TODO Phase 1: replace with a proper router (e.g. react-router-dom)
// Routes: / → HomeView, /wiki/:id → DirectoryView, /page/:id → PageView

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HomeView />
  </React.StrictMode>,
)
