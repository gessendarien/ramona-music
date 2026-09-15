import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Plugin to remove crossorigin attribute from built HTML
// (crossorigin causes file:// loading to fail in Android WebView)
function removeCrossOrigin() {
  return {
    name: 'remove-crossorigin',
    enforce: 'post',
    transformIndexHtml(html) {
      return html.replace(/ crossorigin/g, '');
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), removeCrossOrigin()],
  base: './',
  build: {
    modulePreload: { polyfill: false },
  },
  server: {
    port: 3000,
    host: true
  }
})
