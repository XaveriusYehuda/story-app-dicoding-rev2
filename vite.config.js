import { defineConfig } from 'vite';
import { resolve } from 'path';
import { VitePWA } from 'vite-plugin-pwa'
// import path from 'path'; // Tidak perlu path jika tidak menggunakan path.resolve eksplisit untuk swSrc

export default defineConfig(({ mode }) => {
  return {
    root: '.',
    base: '/story-app-pwa/',
    publicDir: resolve(__dirname, 'public'),
    build: {
      // Default Vite outDir is 'dist' relative to project root
      outDir: 'dist',
      emptyOutDir: true,
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    plugins: [
      VitePWA({
        strategy: 'injectManifest',
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        devOptions: {
          enabled: true,
        },
        injectManifest: {
          swSrc: resolve(__dirname, 'sw.js'),
          swDest: './dist/sw.js',
        },
        manifest: {
          id: '/story-app-pwa/',
          name: 'Dicoding Story App',
          short_name: 'CodeStory',
          scope: '/story-app-pwa/',
          start_url: '/story-app-pwa/',
          theme_color: '#4CAF50',
          display: 'fullscreen',
          icons: [
            {
              src: 'images/logo-dicoding-story-app-48x48.png',
              sizes: '48x48',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'images/logo-dicoding-story-app-144x144.png',
              sizes: '144x144',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'images/logo-dicoding-story-app-196x196.png',
              sizes: '196x196',
              type: 'image/png',
              purpose: 'any',
            },
          ],
          screenshots: [
            {
              src: 'images/dekstop.png',
              sizes: '958x576',
              type: 'image/png',
              form_factor: 'wide',
            },
            {
              src: 'images/mobile.png',
              sizes: '377x775',
              type: 'image/png',
              form_factor: 'narrow',
            },
          ],
        },
      })
    ]
  };
});