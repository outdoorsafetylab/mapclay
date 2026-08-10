import { defineConfig } from '@playwright/test'

// Engine happy-path tests render real maps in a headless browser (jsdom cannot
// provide the WebGL/canvas the map engines need). `test:e2e` builds dist first;
// this config just serves the repo statically so fixtures can load
// /dist/mapclay.js and /dist/renderers/*.mjs.
export default defineConfig({
  testDir: 'e2e',
  testMatch: '**/*.spec.mjs',
  use: { baseURL: 'http://localhost:8000' },
  webServer: {
    command: 'python3 -m http.server 8000',
    url: 'http://localhost:8000',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
})
