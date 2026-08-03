import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { seoPlugin } from './build/seo-plugin'

// https://vite.dev/config/
export default defineConfig({
  // seoPlugin only applies on build: `vite dev` serves the plain SPA, and `npm run preview` is
  // what shows the generated pages. See build/seo-plugin.ts.
  plugins: [react(), seoPlugin()],
})
