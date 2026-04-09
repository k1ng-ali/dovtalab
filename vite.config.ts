import path from "path";
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    }
  },
  base: './', // <--- обязательно с /
  build: {
    outDir: 'dist',
  },
  server: {
    host: true,
    allowedHosts: ["http://82.38.71.121:8000",
        "https://api.dovtalab.app/"
    ]
  }
})
