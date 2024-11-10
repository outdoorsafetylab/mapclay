import defaultExport, { MapOption, loadCSS } from './BaseRenderer'
import { TerraDrawOpenLayersAdapter } from 'terra-draw'

import * as ol from 'ol'
import * as control from 'ol/control'
import * as format from 'ol/format'
import * as geom from 'ol/geom'
import * as layer from 'ol/layer'
import { OSM, Raster, TileDebug, Vector, VectorTile, WMTS, XYZ } from 'ol/source'
import * as style from 'ol/style'
import * as proj from 'ol/proj'
import proj4 from 'proj4'
import * as olProj4 from 'ol/proj/proj4'
loadCSS('https://cdn.jsdelivr.net/npm/ol@10.1.0/ol.css')

/** class: Openlayers */
const Renderer = class extends defaultExport {
  /** fields */
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
    source: { OSM, Raster, TileDebug, Vector, VectorTile, WMTS, XYZ },
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

  /** step: cursor */
  setCursor ({ map }) {
    map.getViewport().style.cursor = 'grab'
    map.on('pointerdrag', _ => {
      map.getViewport().style.cursor = 'grabbing'
    })
    map.on('pointerup', () => {
      map.getViewport().style.cursor = 'grab'
    })
  }

  /** step: options */
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

  /** options: crs */
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
          console.warn(`Invalid Coordinate System: ${crs}, set "EPSG:4326" instead`)
          return crs
        })()
    const projection = await ol.proj.proj4.fromEPSGCode(crsString).catch(() => {
      console.warn(`Fail to retrieve Coordinate System ${crsString}, Use ${crs} instead`)
    })
    ol.proj.setUserProjection(projection)
    return ol.proj.getUserProjection()
  }

  /** options: center, zoom */
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

  /** options: draw */
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

  /** options: control */
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

  /** options: debug, eval */
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

  /** options: data */
  async addTileData ({ map, data, ol }) {
    const tileData = data.filter(record => record.type === 'tile')

    const styleDatum = tileData.filter(datum => datum.type === 'style')[0]
    if (!styleDatum && tileData.length === 0) {
      const baseLayer = new layer.Tile({
        source: new ol.source.OSM(),
        title: 'OSM Carto',
      })
      map.addLayer(baseLayer)
    } else {
      tileData.forEach(datum => {
        const tileLayer = new layer.Tile({
          source: new ol.source.XYZ({ url: datum.url }),
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

  /** options: data.gpx */
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

  /** actions: marker */
  addMarker (config) {
    const element = config.element ?? document.createElement('div')
    if (element.children.length === 0) element.innerHTML = this.svgPin.html
    config.type = 'pin'

    const position = this.ol.proj.fromLonLat(config.xy, this.crs)
    const overlay = new ol.Overlay({
      element,
      position,
      positioning: config.type !== 'pin' ? 'center-center' : 'bottom-center',
    })
    this.map.addOverlay(overlay)

    element.classList.add('marker')
    element.remove = () => this.map.removeOverlay(overlay)
    return element
  }

  /** actions: camera */
  async updateCamera ({ center, animation, zoom, bounds, duration, padding }) {
    const map = this.map
    const view = map.getView()
    center = center ? this.ol.proj.fromLonLat(center, this.crs) : view.getCenter()
    zoom = zoom ?? view.getZoom()

    if (bounds) {
      const boundsTransformed = bounds
        .map(lonLat => this.ol.proj.fromLonLat(lonLat, this.crs))
      view.fit(boundsTransformed.flat(), { duration, padding: Array(4).fill(padding) })
    } else if (animation) {
      view.animate({ center, zoom, duration })
    } else {
      view.setView(center, zoom)
    }

    return new Promise(resolve => {
      setTimeout(resolve, duration ?? 0)
    })
  }

  /** utils: projection */
  project = ([x, y]) =>
    this.map.getPixelFromCoordinate(
      this.ol.proj.fromLonLat(
        [x, y],
        this.crs,
      ),
    )

  unproject = ([x, y]) =>
    this.ol.proj.toLonLat(
      this.map.getCoordinateFromPixel([x, y]),
      this.crs,
    )
}

/** export */
export default Renderer
