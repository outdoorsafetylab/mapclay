import { default as Leaflet } from './dist/renderers/leaflet.mjs'
import { default as Maplibre } from './dist/renderers/maplibre.mjs'
import { default as Openlayers } from './dist/renderers/openlayers.mjs'
export const renderers = { Leaflet, Maplibre, Openlayers }

export * from './dist/mapclay.mjs'
