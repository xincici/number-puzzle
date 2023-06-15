import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from '@unocss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    UnoCSS(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      devOptions: {
        enabled: true
      },
      includeAssets: ['favicon.ico'],
      manifest: {
        name: 'Number Puzzle',
        short_name: 'Puzzle',
        description: 'just an easy puzzle game',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'fox.png',
            sizes: '256x256',
            type: 'image/png',
          }
        ]
      }
    }),
  ],
})
