import defaultExport, { loadCSS } from "./BaseRenderer";
import {
  renderWith,
  renderByYamlWith,
  renderByScriptTargetWith,
} from "./mapclay.mjs";
import * as L from "leaflet/dist/leaflet-src.esm";
import { TerraDrawLeafletAdapter } from "terra-draw";
loadCSS("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css");

const Renderer = class extends defaultExport {
  id = "leaflet";
  version = "1.9.4";
  L = L;

  addMap({ target, center, zoom }) {
    this.map = L.map(target).setView(center.reverse(), zoom);

    // Update map by element size
    const resizeObserver = new ResizeObserver(() => {
      this.map.invalidateSize();
    });
    resizeObserver.observe(target);

    return this.map;
  }

  getTerraDrawAdapter({ draw, L, map }) {
    if (!draw) return { state: "skip" };

    this.terraDrawAdapter = new TerraDrawLeafletAdapter({ lib: L, map });
    return this.getTerraDrawAdapter;
  }

  setControl({ map, control }) {
    if (!control || Object.values(control).filter(v => v).length === 0)
      return { state: "skip" };

    if (control.fullscreen) {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href =
        "https://api.mapbox.com/mapbox.js/plugins/leaflet-fullscreen/v1.0.1/leaflet.fullscreen.css";
      document.body.append(css);

      const script = document.createElement("script");
      script.src =
        "https://api.mapbox.com/mapbox.js/plugins/leaflet-fullscreen/v1.0.1/Leaflet.fullscreen.min.js";
      document.body.append(script);
      script.onload = () => {
        map.addControl(new L.Control.Fullscreen());
      };
    }
    if (control.scale) {
      L.control.scale().addTo(map);
    }
  }

  debugLayer() {
    L.GridLayer.GridDebug = L.GridLayer.extend({
      createTile: function (coords) {
        const tile = document.createElement("div");
        tile.style.outline = "2px solid";
        tile.style.fontWeight = "bold";
        tile.style.fontSize = "14pt";
        tile.innerHTML = [coords.z, coords.x, coords.y].join("/");
        return tile;
      },
    });

    return new L.GridLayer.GridDebug();
  }

  // Configure extra stuff
  setExtra(config) {
    const { map, debug } = config;
    if (!debug && !config.eval) return { state: "skip" };

    if (debug === true) {
      map.addLayer(this.debugLayer());
    }
    if (eval) {
      this.evalScript(config.eval, [
        ["map", map],
        ["L", L],
      ]);
    }
  }

  addMarker(config) {
    const markerIcon = L.divIcon({
      html: this.svgForMarker,
      className: "marker",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
    });
    const xy = Array.from(config.xy).reverse();
    const marker = L.marker(xy, { icon: markerIcon })
      .addTo(this.map)
      .bindPopup(config.message);
    marker.getElement().classList.add("marker");
    marker.getElement().title = config.title;

    return marker.getElement()
  }

  addTileData({ map, data }) {
    const tileData = data.filter(d => d.type === "tile");

    const baseLayers = {};
    const overlayMaps = {};
    if (tileData.length === 0) {
      const osmTile = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
      L.tileLayer(osmTile).addTo(map);
    } else {
      tileData.forEach((datum, index) => {
        const customTile = datum.url;
        const layer = L.tileLayer(customTile);
        const title = datum.title ? datum.title : `Anonymous_${index}`;
        if (index === 0) {
          layer.addTo(map);
        }
        baseLayers[title] = layer;
      });
      L.control.layers(baseLayers, overlayMaps).addTo(map);
    }
  }

  addGPXFile({ map, data }) {
    const gpxUrl = data.find(record => record.type === "gpx");
    if (!gpxUrl) return { state: "skip" };

    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet-gpx/1.7.0/gpx.min.js";
    document.body.append(script);

    const options = {
      gpx_options: {
        joinTrackSegments: false,
      },
      polyline_options: {
        color: "red",
        weight: 3,
        lineCap: "round",
      },
      marker_options: {
        startIconUrl: null,
        endIconUrl: null,
        shadowUrl: "",
        wptIconUrls: {
          "": null,
        },
      },
      async: true,
    };
    script.onload = () => {
      new L.GPX(gpxUrl, options).addTo(map);
    };
  }

  updateCamera(options, animation) {
    const latLon = L.latLng(options.center[1], options.center[0]);
    if (animation) {
      this.map.flyTo(latLon, options.zoom);
    } else {
      this.map.setView(latLon, options.zoom);
    }
  }

  project([lng, lat]) {
    return this.map.latLngToLayerPoint([lat, lng]);
  }
  unproject([x, y]) {
    const latLng = this.map.layerPointToLatLng([x, y]);
    return [latLng.lng, latLng.lat];
  }
};

const converter = config => ({ ...config, use: Renderer });
const render = renderWith(converter);
const renderByYaml = renderByYamlWith(converter);
const renderByScriptTarget = renderByScriptTargetWith(converter);

globalThis.mapclay = { render, renderByYaml };

export { render, renderByYaml, renderByScriptTarget };
export default Renderer;
