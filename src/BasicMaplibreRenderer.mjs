import defaultExport, { MapOption, loadCSS } from './BaseRenderer'
import { renderWith, renderByYamlWith, renderByScriptTargetWith } from './mapclay.mjs';
import "maplibre-gl"
import { addProtocols } from 'maplibre-gl-vector-text-protocol'
import { TerraDrawMapLibreGLAdapter } from 'terra-draw'
loadCSS('https://unpkg.com/maplibre-gl@4.5.2/dist/maplibre-gl.css')

const maplibregl = window.maplibregl

const Renderer = class extends defaultExport {
  id = 'maplibre';

  // Options {{{
  static validOptions = this.validOptions.concat([
    new MapOption({
      name: "pitch",
      desc: "Pitch toward the horizon measured in degrees",
      example: "60",
      example_desc: "Look a little upward",
      isValid: (value) => value <= 90 && value >= 0
    }),
    new MapOption({
      name: "bearing",
      desc: "The compass direction that is 'up'",
      example: "-30",
      example_desc: "Rotate map a little",
      isValid: (value) => value <= 180 && value >= -180
    }),
    new MapOption({
      name: "link",
      desc: "Syn map's position with the hash fragment of the page's URL",
      example: "true",
      example_desc: "Add hash for page URL",
      isValid: (value) => value === 'true'
    }),
    new MapOption({
      name: "style",
      desc: "URL of style document, read https://maplibre.org/maplibre-style-spec/",
      example: "https://tile.openstreetmap.jp/styles/openmaptiles/style.json",
      example_desc: "Style form OSM japan!!!",
      isValid: (value) => URL.parse(value)
    })
  ])
  // }}}
  // Default Config {{{
  static defaultConfig = Object.freeze({
    ...super.defaultConfig,
    pitch: 0,
    bearing: 0,
    style: 'https://demotiles.maplibre.org/style.json',
    link: false,
  })
  // }}}
  // Map Creation {{{
  async createView(target) {
    super.createView(target)

    const tileData = this.config.data.filter(datum => datum.type === 'tile');
    const style = tileData.length !== 0
      ? { version: 8, sources: {}, layers: [], }
      : this.config.style

    const map = new maplibregl.Map({
      container: target,
      style: style,
      center: this.config.center,
      zoom: this.config.zoom,
      pitch: this.config.pitch,
      bearing: this.config.bearing,
      hash: this.config.link,
    });

    return new Promise((resolve, reject) => {
      map.on('load', () => {
        try {
          // FIXME
          if (this.config.draw) {
            // Create Terra Draw
            const adapter = new TerraDrawMapLibreGLAdapter({ map, maplibregl })
            this.setDrawComponent(adapter)
          }
          this.setControl(map, this.config);
          this.setData(map, this.config)
          this.setExtra(map, this.config);
          resolve(map)
        } catch (err) {
          reject(err)
        }
      })
    })
  };
  // }}}

  // Configure controls
  setControl(map, config) {
    if (config.control.fullscreen === true) {
      map.addControl(new maplibregl.FullscreenControl());
    }
    if (config.control.scale === true) {
      const scale = new maplibregl.ScaleControl({
        unit: 'metric'
      });
      map.addControl(scale);
    }
  };

  // Configure extra stuff
  setExtra(map, config) {
    if (config.debug === true) {
      map.showTileBoundaries = true;
    }
    if (config.eval) {
      this.evalScript(config.eval, [["map", map]])
    };
  };

  addMarkers(map, markers) {
    markers.forEach(config => {
      const marker = new maplibregl.Marker()
        .setLngLat(config.xy)
        .addTo(map);
      marker.getElement().classList.add('marker')
      marker.getElement().title = config.title
    });
  }

  addTileData(map, tileData) {
    const style = map.getStyle();
    tileData.forEach((datum, index) => {
      const source = datum.name ? datum.name : index.toString()
      style.sources[source] = { type: "raster", tiles: [datum.url], tileSize: 256 }
      style.layers.push({ id: source, type: "raster", source: source })
    })
    map.setStyle(style)
  }

  // FIXME
  addGPXFile = async (map, gpxUrl) => {
    addProtocols(maplibregl);

    const gpxSourceName = 'gpx';
    const gpxLink = 'gpx://' + gpxUrl;

    const source = {
      'type': 'geojson',
      'data': gpxLink,
    }
    map.addSource(gpxSourceName, source);
    map.addLayer({
      'id': "id_" + gpxSourceName,
      'type': 'line',
      'source': gpxSourceName,
      'paint': {
        'line-color': 'red',
        'line-width': 3
      }
    })

    if (!Object.prototype.hasOwnProperty.call(this.config, 'center')) {
      const data = await map.getSource(gpxSourceName).getData()
      const coordinates = data.features[0].geometry.coordinates
      const bounds = coordinates.reduce(
        (bounds, coord) => bounds.extend(coord),
        new maplibregl.LngLatBounds(coordinates[0], coordinates[0])
      );
      map.fitBounds(bounds, {
        padding: 20
      });
    }
  }

  updateCamera(options, useAnimation) {
    if (useAnimation) {
      this.map.flyTo({
        center: options.center,
        zoom: options.zoom
      })
    } else {
      this.map.setCenter(options.center)
      this.map.setZoom(options.zoom)
    }
  }
}


const render = renderWith({ use: Renderer })
const renderByYaml = renderByYamlWith({ use: Renderer })
const renderByScriptTarget = renderByScriptTargetWith({ use: Renderer })

globalThis.mapclay = { render, renderByYaml }

export { render, renderByYaml, renderByScriptTarget }
export default Renderer
