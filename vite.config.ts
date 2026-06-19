import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isWeb = process.env.MIKI_WEB === 'true'

  const aliases: Record<string, string> = {
    '@': path.resolve(__dirname, './src'),
  }

  if (isWeb) {
    const mockPath = path.resolve(__dirname, './src/services/tauriMock.ts')
    aliases['@tauri-apps/api/menu'] = mockPath
    aliases['@tauri-apps/api/event'] = mockPath
    aliases['@tauri-apps/plugin-fs'] = mockPath
    aliases['@tauri-apps/plugin-dialog'] = mockPath
  }

  return {
    base: isWeb ? '/MIKI_WEB/' : '/',
    plugins: [react()],
    resolve: {
      alias: aliases,
    },
    // Tauri expects a fixed port
    server: {
      port: 1420,
      strictPort: true,
      watch: {
        // Tell Vite to ignore watching `src-tauri`
        ignored: ['**/src-tauri/**'],
      },
    },
  }
})
