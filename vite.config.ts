import path from "path";
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import visualizer from "rollup-plugin-visualizer";
import Components from 'unplugin-vue-components/vite'
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(),
    visualizer({
      open: true,   // автоматически откроет отчет в браузере
      gzipSize: true,
      brotliSize: true
    }),
    Components({
      resolvers: [
        AntDesignVueResolver()
      ]
    })
  ],
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
    allowedHosts: [
        "http://127.0.0.1:8000/",
        "https://api.dovtalab.app/"
    ]
  }
})
