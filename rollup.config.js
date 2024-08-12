import node from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

const production = !process.env.ROLLUP_WATCH;

const general = {
  watch: {
    clearScreen: false,
    include: ["src/**"]
  },
  context: "window",
}

const generalPlugins = [
  node({ mainFields: ['module', 'main'] }),
  production && terser(),
]

const insertAutoRenderFunc = (input) => ({
  name: 'auto-render',
  transform(code, id) {
    if (id.endsWith(input)) {
      console.log('input', input)
      return `${code}\n\nrenderByScriptTarget()`;
    }
    return null;
  }
})

const outputForMain = [
  {
    dir: 'dist/',
    format: 'esm',
    entryFileNames: '[name].mjs',
  },
  {
    name: 'mapclay',
    format: 'umd',
    file: `dist/mapclay.js`,
    exports: "named",
    esModule: false,
  },
]

const outputForRenderer = (name) => [
  {
    dir: 'dist/renderers/',
    format: 'esm',
    entryFileNames: name + '.mjs',
    exports: "named",
  },
  {
    name: name,
    format: 'umd',
    file: `dist/renderers/${name}.js`,
    exports: "named",
  },
]

export default [
  {
    input: 'src/mapclay.mjs',
    output: outputForMain,
    plugins: [
      ...generalPlugins,
      insertAutoRenderFunc('src/mapclay.mjs')
    ],
  },
  {
    input: 'src/BasicLeafletRenderer.mjs',
    output: outputForRenderer('leaflet'),
    plugins: [
      ...generalPlugins,
      insertAutoRenderFunc('src/BasicLeafletRenderer.mjs')
    ],
  },
  {
    input: 'src/BasicMaplibreRenderer.mjs',
    output: outputForRenderer('maplibre'),
    plugins: [
      ...generalPlugins,
      insertAutoRenderFunc('src/BasicMaplibreRenderer.mjs')
    ],
  },
  {
    input: 'src/BasicOpenlayersRenderer.mjs',
    output: outputForRenderer('openlayers'),
    plugins: [
      ...generalPlugins,
      insertAutoRenderFunc('src/BasicOpenlayersRenderer.mjs')
    ],
  },
].map(c => ({ ...general, ...c }))
