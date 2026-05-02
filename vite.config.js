import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    legacy({
      targets: ['chrome 38'], // Target for WebOS 3.5
      additionalLegacyPolyfills: ['regenerator-runtime/runtime']
    })
  ],
  base: './',
})
