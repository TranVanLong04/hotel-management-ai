import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

/** Helper tạo alias cho thư mục trong src */
const srcAlias = (dir: string) =>
  fileURLToPath(new URL(`./src/${dir}`, import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@api': srcAlias('api'),
      '@components': srcAlias('components'),
      '@features': srcAlias('features'),
      '@hooks': srcAlias('hooks'),
      '@layouts': srcAlias('layouts'),
      '@pages': srcAlias('pages'),
      '@routes': srcAlias('routes'),
      '@stores': srcAlias('stores'),
      '@utils': srcAlias('utils'),
      '@types': srcAlias('types'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
})
