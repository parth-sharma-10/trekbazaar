import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), tailwindcss()],
  // Libraries change less often than app code, so they get their own cacheable chunk.
  build: {
    rolldownOptions: {
      output: { codeSplitting: { groups: [{ name: 'vendor', test: /node_modules/ }] } },
    },
  },
  server: {
    proxy: { '/api': 'http://localhost:4000' },
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
