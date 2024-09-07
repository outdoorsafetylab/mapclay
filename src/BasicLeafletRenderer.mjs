import defaultExport, { loadCSS } from './BaseRenderer';
import { renderWith, renderByTextContentWith, renderByScriptTargetWith } from './mapclay.mjs';
import * as L from 'leaflet/dist/leaflet-src.esm'
import { TerraDrawLeafletAdapter } from 'terra-draw'
loadCSS('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css')


const Renderer = class extends defaultExport {
  id = 'leaflet';
  version = '1.9.4';

  static validOptions = super.validOptions.concat([
  ])

  async createView(target) {
    super.createView(target)

    const map = L.map(target)
      .setView(
        this.config.center.reverse(),
        this.config.zoom
      )

    // Update map by element size
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(target);

    this.setControl(map, this.config)
    this.setData(map, this.config)
    this.setExtra(map, this.config)

    if (this.config.draw) {
      const adapter = new TerraDrawLeafletAdapter({ lib: L, map })
      this.setDrawComponent(adapter)
    }
    return map
  };

  // FIXME
  // Configure controls
  setControl(map, config) {
    if (config.control.fullscreen) {
      let css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = 'https://api.mapbox.com/mapbox.js/plugins/leaflet-fullscreen/v1.0.1/leaflet.fullscreen.css';
      document.body.append(css);

      let script = document.createElement('script');
      script.src = "https://api.mapbox.com/mapbox.js/plugins/leaflet-fullscreen/v1.0.1/Leaflet.fullscreen.min.js";
      document.body.append(script);
      script.onload = () => {
        map.addControl(new L.Control.Fullscreen());
      }
    }
    if (config.control.scale) {
      L.control.scale().addTo(map);
    }
  };

  debugLayer() {
    L.GridLayer.GridDebug = L.GridLayer.extend({
      createTile: function(coords) {
        const tile = document.createElement('div');
        tile.style.outline = '2px solid';
        tile.style.fontWeight = 'bold';
        tile.style.fontSize = '14pt';
        tile.innerHTML = [coords.z, coords.x, coords.y].join('/');
        return tile;
      }
    });

    return new L.GridLayer.GridDebug();
  }

  // Configure extra stuff
  setExtra(map, config) {
    if (config.debug == true) {
      map.addLayer(this.debugLayer());
    }
    if (config.eval) {
      const evalScript = Function('map, config, L', config.eval)
        .bind(this)
      evalScript(map, config, L)
    }
  };

  addMarkers(map, markers) {
    var markerIcon = L.icon({
      iconUrl: `https://unpkg.com/leaflet@${this.version}/dist/images/marker-icon.png`,
      iconRetinaUrl: `https://unpkg.com/leaflet@${this.version}/dist/images/marker-icon-2x.png`,
      shadowUrl: `https://unpkg.com/leaflet@${this.version}/dist/images/marker-shadow.png`,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41]
    })
    markers.forEach(config => {
      let xy = Array.from(config.xy).reverse()
      let marker = L.marker(xy, { icon: markerIcon })
        .addTo(map)
        .bindPopup(config.message)
      marker.getElement().classList.add('marker')
      marker.getElement().title = config.title
    });
  }

  addTileData(map, tileData) {
    var baseLayers = {}
    var overlayMaps = {}
    if (tileData.length == 0) {
      const osmTile = 'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png'
      L.tileLayer(osmTile).addTo(map);
    } else {
      tileData.forEach((datum, index) => {
        const customTile = datum.url
        const layer = L.tileLayer(customTile);
        const title = datum.title ? datum.title : `Anonymous_${index}`
        if (index == 0) {
          layer.addTo(map)
        }
        baseLayers[title] = layer
      })
      L.control.layers(baseLayers, overlayMaps).addTo(map);
    }
  }

  addGPXFile(map, gpxUrl) {
    let script = document.createElement('script');
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet-gpx/1.7.0/gpx.min.js";
    document.body.append(script);

    let options = {
      gpx_options: {
        joinTrackSegments: false
      },
      polyline_options: {
        color: 'red',
        weight: 3,
        lineCap: 'round'
      },
      marker_options: {
        startIconUrl: null,
        endIconUrl: null,
        shadowUrl: '',
        wptIconUrls: {
          '': null
        }
      },
      async: true
    }
    script.onload = () => {
      new L.GPX(gpxUrl, options).addTo(map);
    }
  }

  updateCamera(options, animation) {
    let latLon = L.latLng(options.center[1], options.center[0])
    if (animation) {
      this.map.flyTo(latLon, options.zoom);
    } else {
      this.map.setView(latLon, options.zoom);
    }
  }
}


const render = renderWith({ use: Renderer })
const renderByTextContent = renderByTextContentWith({ use: Renderer })
const renderByScriptTarget = renderByScriptTargetWith({ use: Renderer })

if (document.currentScript) {
  window.mapclay = { render, renderByTextContent }
}

export { render, renderByTextContent, renderByScriptTarget }
export default Renderer
