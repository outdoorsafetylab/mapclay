import defaultExport, { MapOption, loadCSS } from "./BaseRenderer";
import {
  renderWith,
  renderByYamlWith,
  renderByScriptTargetWith,
} from "./mapclay.mjs";
import "maplibre-gl";
import { addProtocols } from "maplibre-gl-vector-text-protocol";
import { TerraDrawMapLibreGLAdapter } from "terra-draw";
loadCSS("https://unpkg.com/maplibre-gl@4.5.2/dist/maplibre-gl.css");

const Renderer = class extends defaultExport {
  id = "maplibre";
  pitch = 0;
  bearing = 0;
  style = "https://demotiles.maplibre.org/style.json";
  link = false;
  maplibregl = window.maplibregl;

  // Options {{{
  static validOptions = this.validOptions.concat([
    new MapOption({
      name: "pitch",
      desc: "Pitch toward the horizon measured in degrees",
      example: "60",
      example_desc: "Look a little upward",
      isValid: value => value <= 90 && value >= 0,
    }),
    new MapOption({
      name: "bearing",
      desc: "The compass direction that is 'up'",
      example: "-30",
      example_desc: "Rotate map a little",
      isValid: value => value <= 180 && value >= -180,
    }),
    new MapOption({
      name: "link",
      desc: "Syn map's position with the hash fragment of the page's URL",
      example: "true",
      example_desc: "Add hash for page URL",
      isValid: value => value === "true",
    }),
    new MapOption({
      name: "style",
      desc: "URL of style document, read https://maplibre.org/maplibre-style-spec/",
      example: "https://tile.openstreetmap.jp/styles/openmaptiles/style.json",
      example_desc: "Style form OSM japan!!!",
      isValid: value => URL.parse(value),
    }),
  ]);
  // }}}

  async addMap({
    maplibregl,
    target,
    style,
    data,
    center,
    zoom,
    pitch,
    bearing,
    link,
  }) {
    const tileData = data.filter(d => d.type === "tile");
    const maplibreStyle =
      tileData.length !== 0 ? { version: 8, sources: {}, layers: [] } : style;

    this.map = new maplibregl.Map({
      container: target,
      style: maplibreStyle,
      center,
      zoom,
      pitch,
      bearing,
      hash: link,
    });

    return new Promise((resolve, _) => {
      this.map.on("load", () => {
        resolve(this.map);
      });
    });
  }

  getTerraDrawAdapter({ maplibregl, map, draw }) {
    if (!draw) return { state: "skip" };

    this.terraDrawAdapter = new TerraDrawMapLibreGLAdapter({ map, maplibregl });
    return this.terraDrawAdapter;
  }

  // Configure controls
  setControl({ maplibregl, map, control }) {
    if (!control || Object.values(control).filter(v => v).length === 0)
      return { state: "skip" };

    if (control.fullscreen === true) {
      map.addControl(new maplibregl.FullscreenControl());
    }
    if (control.scale === true) {
      const scale = new maplibregl.ScaleControl({
        unit: "metric",
      });
      map.addControl(scale);
    }
  }

  // Configure extra stuff
  setExtra(config) {
    const { map, debug } = config;
    if (!debug && !config.eval) return { state: "skip" };

    if (debug === true) {
      map.showTileBoundaries = true;
    }
    if (config.eval) {
      this.evalScript(config.eval, [["map", map]]);
    }
  }

  addMarker(config) {
    const marker = new this.maplibregl.Marker()
      .setLngLat(config.xy)
      .addTo(this.map);
    marker.getElement().classList.add("marker");
    marker.getElement().title = config.title;

    return marker.getElement()
  }

  addTileData({ map, data }) {
    const tileData = data.filter(d => d.type === "tile");
    if (tileData.length === 0) return { state: "skip" };

    const style = map.getStyle();
    tileData.forEach((datum, index) => {
      const source = datum.name ? datum.name : index.toString();
      style.sources[source] = {
        type: "raster",
        tiles: [datum.url],
        tileSize: 256,
      };
      style.layers.push({ id: source, type: "raster", source: source });
    });
    map.setStyle(style);
  }

  async addGPXFile({ maplibregl, map, data }) {
    const gpxUrl = data.find(record => record.type === "gpx");
    if (!gpxUrl) return { state: "skip" };

    addProtocols(maplibregl);

    const gpxSourceName = "gpx";
    const gpxLink = "gpx://" + gpxUrl;

    const source = {
      type: "geojson",
      data: gpxLink,
    };
    map.addSource(gpxSourceName, source);
    map.addLayer({
      id: "id_" + gpxSourceName,
      type: "line",
      source: gpxSourceName,
      paint: {
        "line-color": "red",
        "line-width": 3,
      },
    });

    if (!Object.prototype.hasOwnProperty.call(this, "center")) {
      const data = await map.getSource(gpxSourceName).getData();
      const coordinates = data.features[0].geometry.coordinates;
      const bounds = coordinates.reduce(
        (bounds, coord) => bounds.extend(coord),
        new maplibregl.LngLatBounds(coordinates[0], coordinates[0]),
      );
      map.fitBounds(bounds, {
        padding: 20,
      });
    }
  }

  updateCamera(options, useAnimation) {
    if (useAnimation) {
      this.map.flyTo({
        center: options.center,
        zoom: options.zoom,
      });
    } else {
      this.map.setCenter(options.center);
      this.map.setZoom(options.zoom);
    }
  }

  project([lng, lat]) {
    return this.map.project([lng, lat]);
  }
  unproject([x, y]) {
    const { lng, lat } = this.map.unproject([x, y])
    return [lng, lat]
  }
};

const converter = config => ({ ...config, use: Renderer });
const render = renderWith(converter);
const renderByYaml = renderByYamlWith(converter);
const renderByScriptTarget = renderByScriptTargetWith(converter);

globalThis.mapclay = { render, renderByYaml };

export { render, renderByYaml, renderByScriptTarget };
export default Renderer;
