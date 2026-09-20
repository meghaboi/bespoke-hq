import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Builds the two background widgets (AeroShards, Iridescence) as one
// self-contained ES module bundle, dropped into ../assets/dist so the
// static HTML pages can load it with a single <script type="module"> tag.
// React is bundled in (not left as an external) since these pages load no
// other copy of it.
export default defineConfig({
  plugins: [react()],
  // Vite's default NODE_ENV define doesn't reliably reach code inside
  // library-mode bundles, and React's own package entry branches on
  // process.env.NODE_ENV at require-time — without this it throws
  // "process is not defined" the instant the bundle runs in the browser.
  define: {
    'process.env.NODE_ENV': JSON.stringify('production')
  },
  build: {
    outDir: '../assets/dist',
    emptyOutDir: true,
    lib: {
      entry: 'src/main.jsx',
      formats: ['es'],
      fileName: () => 'bg-widgets.js'
    },
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        assetFileNames: 'bg-widgets[extname]'
      }
    }
  }
});
