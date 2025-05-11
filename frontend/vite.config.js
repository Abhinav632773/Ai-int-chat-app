import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server :{
    headers : {
      "Cross-Origin-Embedder-Policy":" require-corp",
      "Cross-Origin-Opener-Policy": "same-origin"
    }
  },
  base: process.env.VITE_BASE_URL || '/Ai-int-chat-app',
})
