import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    dedupe: ['react', 'react-dom', 'react-router-dom'],
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    minify: 'esbuild', // Используем esbuild вместо terser
  },
  esbuild: {
    drop: [], // Не удалять console.log и debugger
  },
})


