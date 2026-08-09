import defaultExport, { loadCSS } from './BaseRenderer'
import * as L from 'leaflet'
import { TerraDrawLeafletAdapter } from 'terra-draw-leaflet-adapter'
loadCSS('https://unpkg.com/leaflet@2.0.0-alpha.1/dist/leaflet.css')

/** class: Leaflet */
const Renderer = class extends defaultExport {
  /** fields */
  id = 'leaflet'
  version = '2.0.0-alpha.1'
  L = L

  /** options: center, zoom */
  addMap ({ target, center, zoom }) {
    const [x, y] = center
    this.map = new L.Map(target).setView([y, x], zoom)

    // Update map by element size
    const resizeObserver = new window.ResizeObserver(() => {
      this.map.invalidateSize()
    })
    resizeObserver.observe(target)

    return this.map
  }

  /** options: draw */
  getTerraDrawAdapter ({ draw, L, map }) {
    if (!draw) return { state: 'skip' }

    this.terraDrawAdapter = new TerraDrawLeafletAdapter({ lib: L, map })
    return this.getTerraDrawAdapter
  }

  /** options: control */
  setControl ({ map, control }) {
    if (!control || Object.values(control).filter(v => v).length === 0) { return { state: 'skip' } }

    if (control.fullscreen) {
      class FullscreenControl extends L.Control {
        onAdd (map) {
          const btn = document.createElement('button')
          btn.textContent = '⛶'
          btn.onclick = () => map.getContainer().requestFullscreen?.()
          return btn
        }
      }
      new FullscreenControl({ position: 'topleft' }).addTo(map)
    }
    if (control.scale) {
      new L.Control.Scale().addTo(map)
    }
  }

  debugLayer () {
    class GridDebug extends L.GridLayer {
      createTile (coords) {
        const tile = document.createElement('div')
        tile.style.outline = '2px solid'
        tile.style.fontWeight = 'bold'
        tile.style.fontSize = '14pt'
        tile.innerHTML = [coords.z, coords.x, coords.y].join('/')
        return tile
      }
    }
    return new GridDebug()
  }

  /** options: debug, eval */
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

  /** options: data */
  addTileData ({ map, data }) {
    const tileData = data.filter(d => d.type === 'tile')

    const baseLayers = {}
    const overlayMaps = {}
    if (tileData.length === 0) {
      const osmTile = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
      new L.TileLayer(osmTile).addTo(map)
    } else {
      tileData.forEach((datum, index) => {
        const customTile = datum.url
        const layer = new L.TileLayer(customTile)
        const title = datum.title ? datum.title : `Anonymous_${index}`
        if (index === 0) {
          layer.addTo(map)
        }
        baseLayers[title] = layer
      })
      const layerControl = new L.Control.Layers(baseLayers, overlayMaps).addTo(map)
      map.removeControl(layerControl)
    }
  }

  /** actions: marker */
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
    const markerIcon = new L.DivIcon({
      ...options,
      className: 'marker',
    })
    const xy = Array.from(config.xy).reverse()
    const marker = new L.Marker(xy, { icon: markerIcon })
      .addTo(this.map)
    const element = marker.getElement()
    element.classList.add('marker')

    element.remove = () => this.map.removeLayer(marker)
    return element
  }

  /** actions: camera */
  async updateCamera ({ center, zoom, bounds, animation, padding, duration }) {
    const latLon = center ? new L.LatLng(center[1], center[0]) : this.map.getCenter()
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

  /** utils: projection */
  project ([lng, lat]) {
    return this.map.latLngToContainerPoint([lat, lng])
  }

  unproject ([x, y]) {
    const latLng = this.map.containerPointToLatLng([x, y])
    return [latLng.lng, latLng.lat]
  }
}

/** export */
export default Renderer
