import node from '@rollup/plugin-node-resolve'
import terser from '@rollup/plugin-terser'
import { join } from 'path'
import { existsSync } from 'fs'

const production = !process.env.ROLLUP_WATCH

const general = {
  watch: {
    clearScreen: false,
    include: ['src/**'],
  },
  context: 'window',
}

const generalPlugins = [
  node({ mainFields: ['module', 'main'] }),
  production && terser({
    keep_fnames: true,
  }),
  {
    name: 'watch-anyway',
    buildStart () {
      const mapclayPath = join(process.cwd(), 'mapclay', 'src', 'mapclay.mjs')
      if (existsSync(mapclayPath)) {
        this.addWatchFile(mapclayPath)
      } else {
        console.warn('mapclay.mjs not found at:', mapclayPath)
      }
    },
  },
]

const outputForMain = [
  {
    dir: 'dist/',
    format: 'esm',
    entryFileNames: '[name].mjs',
  },
  {
    name: 'mapclay',
    format: 'umd',
    file: 'dist/mapclay.js',
    exports: 'named',
    esModule: false,
    outro: 'renderByScriptTarget()',
  },
]

const outputForRenderer = name => [
  {
    dir: 'dist/renderers/',
    format: 'esm',
    entryFileNames: name + '.mjs',
    exports: 'named',
  },
  {
    name,
    format: 'umd',
    file: `dist/renderers/${name}.js`,
    exports: 'named',
    outro: 'renderByScriptTarget()',
  },
]

export default [
  {
    input: 'src/mapclay.mjs',
    output: outputForMain,
    plugins: [...generalPlugins],
  },
  {
    input: 'src/BasicLeafletRenderer.mjs',
    output: outputForRenderer('leaflet'),
    plugins: [...generalPlugins],
  },
  {
    input: 'src/BasicMaplibreRenderer.mjs',
    output: outputForRenderer('maplibre'),
    plugins: [...generalPlugins],
  },
  {
    input: 'src/BasicOpenlayersRenderer.mjs',
    output: outputForRenderer('openlayers'),
    plugins: [...generalPlugins],
  },
].map(c => ({ ...general, ...c }))
