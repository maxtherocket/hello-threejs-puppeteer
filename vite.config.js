import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3006
  },
  assetsInclude: ['**/*.gltf', '**/*.mp3'],
  build: {
    outDir: 'dist'
  }
})
