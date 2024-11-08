import defaultExport, { loadCSS } from './BaseRenderer'
import {
  renderWith,
  renderByYamlWith,
  renderByScriptTargetWith,
} from './mapclay.mjs'
import * as L from 'leaflet/dist/leaflet-src.esm'
import { TerraDrawLeafletAdapter } from 'terra-draw'
loadCSS('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css')

const Renderer = class extends defaultExport {
  id = 'leaflet'
  version = '1.9.4'
  L = L

  addMap ({ target, center, zoom }) {
    const [x, y] = center
    this.map = L.map(target).setView([y, x], zoom)

    // Update map by element size
    const resizeObserver = new window.ResizeObserver(() => {
      this.map.invalidateSize()
    })
    resizeObserver.observe(target)

    return this.map
  }

  getTerraDrawAdapter ({ draw, L, map }) {
    if (!draw) return { state: 'skip' }

    this.terraDrawAdapter = new TerraDrawLeafletAdapter({ lib: L, map })
    return this.getTerraDrawAdapter
  }

  setControl ({ map, control }) {
    if (!control || Object.values(control).filter(v => v).length === 0) { return { state: 'skip' } }

    if (control.fullscreen) {
      const css = document.createElement('link')
      css.rel = 'stylesheet'
      css.href =
        'https://api.mapbox.com/mapbox.js/plugins/leaflet-fullscreen/v1.0.1/leaflet.fullscreen.css'
      document.body.append(css)

      const script = document.createElement('script')
      script.src =
        'https://api.mapbox.com/mapbox.js/plugins/leaflet-fullscreen/v1.0.1/Leaflet.fullscreen.min.js'
      document.body.append(script)
      script.onload = () => {
        map.addControl(new L.Control.Fullscreen())
      }
    }
    if (control.scale) {
      L.control.scale().addTo(map)
    }
  }

  debugLayer () {
    L.GridLayer.GridDebug = L.GridLayer.extend({
      createTile: function (coords) {
        const tile = document.createElement('div')
        tile.style.outline = '2px solid'
        tile.style.fontWeight = 'bold'
        tile.style.fontSize = '14pt'
        tile.innerHTML = [coords.z, coords.x, coords.y].join('/')
        return tile
      },
    })

    return new L.GridLayer.GridDebug()
  }

  // Configure extra stuff
  setExtra (config) {
    const { map, debug } = config
    if (!debug && !config.eval) return { state: 'skip' }

    if (debug === true) {
      map.addLayer(this.debugLayer())
    }
    if (config.eval) {
      this.evalScript(config.eval, [
        ['map', map],
        ['L', L],
      ])
    }
  }

  addMarker (config) {
    const options = config.element
      ? {
          html: config.element.innerHTML,
          iconSize: config.size,
          iconAnchor: config.anchor,
        }
      : {
          html: this.svgPin.html,
          iconSize: this.svgPin.size,
          iconAnchor: this.svgPin.anchor,
        }
    const markerIcon = L.divIcon({
      ...options,
      className: 'marker',
    })
    const xy = Array.from(config.xy).reverse()
    const marker = L.marker(xy, { icon: markerIcon })
      .addTo(this.map)
    const element = marker.getElement()
    element.classList.add('marker')

    element.remove = () => this.map.removeLayer(marker)
    return element
  }

  addTileData ({ map, data }) {
    const tileData = data.filter(d => d.type === 'tile')

    const baseLayers = {}
    const overlayMaps = {}
    if (tileData.length === 0) {
      const osmTile = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
      L.tileLayer(osmTile).addTo(map)
    } else {
      tileData.forEach((datum, index) => {
        const customTile = datum.url
        const layer = L.tileLayer(customTile)
        const title = datum.title ? datum.title : `Anonymous_${index}`
        if (index === 0) {
          layer.addTo(map)
        }
        baseLayers[title] = layer
      })
      const layerControl = L.control.layers(baseLayers, overlayMaps).addTo(map)
      map.removeControl(layerControl)
    }
  }

  addGPXFile ({ map, data }) {
    const gpxUrl = data.find(record => record.type === 'gpx')
    if (!gpxUrl) return { state: 'skip' }

    const script = document.createElement('script')
    script.src =
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet-gpx/1.7.0/gpx.min.js'
    document.body.append(script)

    const options = {
      gpx_options: {
        joinTrackSegments: false,
      },
      polyline_options: {
        color: 'red',
        weight: 3,
        lineCap: 'round',
      },
      marker_options: {
        startIconUrl: null,
        endIconUrl: null,
        shadowUrl: '',
        wptIconUrls: {
          '': null,
        },
      },
      async: true,
    }
    script.onload = () => {
      new L.GPX(gpxUrl, options).addTo(map)
    }
  }

  async updateCamera ({ center, zoom, bounds, animation, padding, duration }) {
    const latLon = center ? L.latLng(center[1], center[0]) : this.map.getCenter()
    const options = {
      animate: animation ?? false,
      padding: [padding, padding],
      duration: (duration ?? 250) / 1000,
    }

    if (bounds) {
      const [[w, s], [e, n]] = bounds
      const latLngBounds = new this.L.LatLngBounds([[s, w], [n, e]])
      if (!latLngBounds.isValid()) {
        throw new Error('Bounds are not valid.')
      }
      const target = this.map._getBoundsCenterZoom(latLngBounds, options)
      this.map.flyTo(target.center, target.zoom, options)
    } else if (animation) {
      this.map.flyTo(latLon, zoom ?? this.map.getZoom(), options)
    } else {
      this.map.setView(latLon, zoom)
    }

    return new Promise(resolve => {
      setTimeout(resolve, duration ?? 0)
    })
  }

  project ([lng, lat]) {
    return this.map.latLngToContainerPoint([lat, lng])
  }

  unproject ([x, y]) {
    const latLng = this.map.containerPointToLatLng([x, y])
    return [latLng.lng, latLng.lat]
  }
}

export default Renderer
