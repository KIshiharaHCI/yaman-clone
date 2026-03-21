import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        team: resolve(__dirname, 'team.html'),
        ueberUns: resolve(__dirname, 'ueber-uns.html'),
        fahrzeugsuche: resolve(__dirname, 'fahrzeugsuche.html'),
        fahrzeug: resolve(__dirname, 'fahrzeug.html'),
      },
    },
  },
})
