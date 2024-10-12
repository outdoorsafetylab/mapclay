import defaultExport, { MapOption, loadCSS } from './BaseRenderer'
import {
  renderWith,
  renderByYamlWith,
  renderByScriptTargetWith,
} from './mapclay'
import { TerraDrawOpenLayersAdapter } from 'terra-draw'

import * as ol from 'ol'
import * as control from 'ol/control'
import * as format from 'ol/format'
import * as geom from 'ol/geom'
import * as layer from 'ol/layer'
import * as source from 'ol/source'
import * as style from 'ol/style'
import * as proj from 'ol/proj'
import proj4 from 'proj4'
import * as olProj4 from 'ol/proj/proj4'
loadCSS('https://cdn.jsdelivr.net/npm/ol@10.1.0/ol.css')

const Renderer = class extends defaultExport {
  id = 'openlayers'
  crs = 'EPSG:4326'
  control = {
    fullscreen: false,
    scale: false,
  }

  ol = {
    ...ol,
    control,
    format,
    geom,
    layer,
    source,
    style,
    proj: { ...proj, proj4: olProj4 },
  }

  proj4 = proj4

  get steps () {
    return [this.setCoordinateSystem, ...super.steps, this.setCursor]
  }

  static validOptions = super.validOptions.concat([
    new MapOption({
      name: 'crs',
      desc: 'Coordinate Reference System',
      example: 'EPSG:3826',
      exampleDesc: 'Taiwan TM2',
      isValid: value =>
        !!value?.toString()?.match(/^EPSG:\d+$|^\d+$/),
    }),
  ])

  async setCoordinateSystem ({ proj4, ol, crs }) {
    // Set projection
    proj4.defs(
      'EPSG:3826',
      '+proj=tmerc +lat_0=0 +lon_0=121 +k=0.9999 +x_0=250000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
    )
    ol.proj.proj4.register(proj4)
    const crsString = this.validateOption('crs', crs)
      ? crs
      : (() => {
          console.warn(
            `Invalid Coordinate System: ${crs}, set "EPSG:4326" instead`,
          )
          return crs
        })()
    const projection = await ol.proj.proj4.fromEPSGCode(crsString).catch(() => {
      console.warn(
        `Fail to retrieve Coordinate System ${crsString}, Use ${crs} instead`,
      )
    })
    ol.proj.setUserProjection(projection)
    return ol.proj.getUserProjection()
  }

  async addMap ({ ol, target, center, zoom }) {
    // Set basemap and camera
    this.map = new ol.Map({
      target,
      view: new ol.View({
        constrainResolution: true,
        center,
        zoom,
      }),
    })

    return this.map
  }

  getTerraDrawAdapter ({ map, ol, draw }) {
    if (!draw) return { state: 'skip' }

    this.terraDrawAdapter = new TerraDrawOpenLayersAdapter({
      lib: {
        Feature: ol.Feature,
        GeoJSON: ol.format.GeoJSON,
        Style: ol.style.Style,
        VectorLayer: ol.layer.Vector,
        VectorSource: ol.source.Vector,
        Stroke: ol.style.Stroke,
        Circle: ol.style.Circle,
        Fill: ol.style.Fill,
        getUserProjection: ol.proj.getUserProjection,
      },
      map,
      coordinatePrecision: 9,
    })
    return this.terraDrawAdapter
  }

  setCursor ({ map }) {
    map.getViewport().style.cursor = 'grab'
    map.on('pointerdrag', _ => {
      map.getViewport().style.cursor = 'grabbing'
    })
    map.on('pointerup', () => {
      map.getViewport().style.cursor = 'grab'
    })
  }

  setOptionsAliases (config) {
    super.handleAliases(config)
    if (config.STYLE) {
      config.data.push({
        type: 'style',
        url: config.STYLE,
      })
      delete config.STYLE
    }
  }

  setControl ({ map, control, ol }) {
    if (!control || Object.values(control).filter(v => v).length === 0) { return { state: 'skip' } }

    if (control.fullscreen === true) {
      map.addControl(new ol.control.FullScreen())
    }
    // TODO Add more options by config
    if (control.scale === true) {
      map.addControl(
        new ol.control.ScaleLine({
          units: 'metric',
        }),
      )
    }
  }

  setExtra (config) {
    const { map, debug, ol } = config
    if (!debug && !config.eval) return { state: 'skip' }

    if (debug === true) {
      map.addLayer(
        new layer.Tile({
          source: new ol.source.TileDebug(),
        }),
      )
    }
    if (config.eval) {
      this.evalScript(config.eval, [
        ['map', map],
        ['ol', ol],
      ])
    }
  }

  // Apply vector layer for markers onto map
  addMarker (config) {
    const position = this.ol.proj.fromLonLat(config.xy, this.crs)
    const element = document.createElement('div')
    element.innerHTML = config.type === 'circle' ? this.svgForAnchor.html : this.svgForMarker.html
    element.title = config.title
    element.classList.add('marker')

    const overlay = new ol.Overlay({
      element,
      position,
      positioning: config.type === 'circle' ? 'center-center' : 'bottom-center',
    })
    this.map.addOverlay(overlay)

    element.remove = () => this.map.removeOverlay(overlay)
    return element
  }

  async addTileData ({ map, data }) {
    const tileData = data.filter(record => record.type === 'tile')

    const styleDatum = tileData.filter(datum => datum.type === 'style')[0]
    if (!styleDatum && tileData.length === 0) {
      const baseLayer = new layer.Tile({
        source: new source.OSM(),
        title: 'OSM Carto',
      })
      map.addLayer(baseLayer)
    } else {
      tileData.forEach(datum => {
        const tileLayer = new layer.Tile({
          source: new source.XYZ({ url: datum.url }),
          title: datum.title ? datum.title : 'Anonymous',
        })
        map.addLayer(tileLayer)
      })
    }

    // TODO Layers for WMTS
    const wmtsData = tileData.filter(datum => datum.type === 'wmts')[0]
    if (wmtsData) {
      // this.addLayersInWMTS(map, wmtsData)
    }

    return new Promise(resolve => {
      map.on('rendercomplete', () => {
        resolve(map)
      })
    })
  }

  addGPXFile ({ map, ol, data }) {
    const gpxUrl = data.find(record => record.type === 'gpx')
    if (!gpxUrl) return { state: 'skip' }

    const style = {
      MultiLineString: new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: 'red',
          width: 3,
        }),
      }),
    }

    map.addLayer(
      new ol.layer.Vector({
        source: new ol.source.Vector({
          url: gpxUrl,
          format: new ol.format.GPX(),
        }),
        style: () => style.MultiLineString,
      }),
    )

    // if (Object.prototype.hasOwnProperty.call(this.config, 'center')) {
    //   this.flyTo(map, { center: [10, 10], zoom: 10 })
    // }
  }

  updateCamera (options, useAnimation) {
    const map = this.map
    const view = map.getView()
    const xy = this.ol.proj.fromLonLat(options.center, this.crs)
    if (useAnimation) {
      flyTo(
        map,
        { center: xy, zoom: options.zoom },
        () => null,
      )
    } else {
      view.animate({
        center: options.center,
        zoom: options.zoom,
        duration: 300,
      })
    }
  }

  // FIXME Beaware of user projection in ol/proj
  project ([x, y]) {
    return this.map.getPixelFromCoordinate([x, y])
  }

  unproject ([x, y]) {
    return this.map.getCoordinateFromPixel([x, y])
  }
}

// Pan map to a specific location
function flyTo (map, status, done) {
  const duration = 2500
  const view = map.getView()
  const nextZoom = status.zoom ? status.zoom : view.getZoom()
  const nextCenter = status.center ? status.center : view.center

  let parts = 2
  let called = false
  function callback (complete) {
    --parts
    if (called) return
    if (parts === 0 || !complete) {
      called = true
      done(complete)
    }
  }

  // Move view to the given location
  view.animate(
    {
      center: nextCenter,
      duration,
    },
    callback,
  )
  // At the same time, zoom out and zoom in
  view.animate(
    {
      zoom: (view.getZoom() + nextZoom) / 2 - 1,
      duration: duration / 2,
    },
    {
      zoom: nextZoom,
      duration: duration / 2,
    },
    callback,
  )
}

const converter = config => ({ ...config, use: Renderer })
const render = renderWith(converter)
const renderByYaml = renderByYamlWith(converter)
const renderByScriptTarget = renderByScriptTargetWith(converter)

globalThis.mapclay = { render, renderByYaml }

export { render, renderByYaml, renderByScriptTarget }
export default Renderer
