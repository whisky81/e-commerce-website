import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
    allowedHosts:[
      "https://f70c-27-79-215-232.ngrok-free.app",
      ".ngrok-free.app"
    ]
  }
})
