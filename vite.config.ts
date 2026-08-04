import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * Caminho base. Fica em "/" no desenvolvimento, na pré-visualização e nos testes;
 * o workflow do GitHub Pages define VITE_BASE_PATH para o subdiretório do repositório.
 */
const base = process.env.VITE_BASE_PATH ?? '/';

/**
 * Identificador da compilação, visível nas Definições. Serve para saber qual a
 * versão que um telemóvel está mesmo a correr — que nem sempre é a última
 * publicada, se houver cache pelo meio.
 */
const buildId = [
  new Date().toISOString().slice(0, 16).replace('T', ' '),
  process.env.GITHUB_SHA?.slice(0, 7),
]
  .filter(Boolean)
  .join(' · ');

// https://vite.dev/config/
export default defineConfig({
  base,
  define: {
    __BUILD_ID__: JSON.stringify(buildId),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // `autoUpdate`, e não `prompt`: com `prompt` é preciso construir uma
      // interface que pergunte "há uma versão nova, atualizar?" e, sem ela, um
      // telemóvel que já tenha a aplicação instalada fica preso para sempre na
      // versão que guardou em cache. Recarregar é seguro aqui, porque a sessão
      // de treino é gravada no dispositivo a cada alteração e é retomada no
      // ponto exato.
      registerType: 'autoUpdate',
      // O registo é feito à mão em `main.tsx`, para o comportamento de
      // atualização ficar explícito e verificável em vez de implícito.
      injectRegister: null,
      includeAssets: ['favicon.svg', 'icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'Treinos — plano de pré-época',
        short_name: 'Treinos',
        description:
          'Acompanhamento de treinos de mobilidade, ginásio e futebol para um atleta de 17 anos.',
        lang: 'pt-PT',
        dir: 'ltr',
        start_url: base,
        scope: base,
        id: base,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0b0f14',
        theme_color: '#0b0f14',
        categories: ['health', 'fitness', 'sports'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Apenas assets da própria aplicação. Nunca vídeos do YouTube.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallback: `${base}index.html`,
        cleanupOutdatedCaches: true,
        // Uma versão nova assume o controlo imediatamente, incluindo das páginas
        // que já estavam abertas. Sem `clientsClaim`, quem tem a aplicação
        // aberta continua a ser servido pela versão antiga.
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
  },
});
