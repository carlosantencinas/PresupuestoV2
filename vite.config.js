import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  base: '/presupuestoV2/', // 👈 ¡Agrega esta línea!
  plugins: [react(), visualizer({ open: true })],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          mui: ['@mui/material', '@mui/icons-material'],
          xlsx: ['xlsx'],
          charts: ['recharts'],
          pdf: ['html2pdf.js']
        }
      }
    }
  }
})
