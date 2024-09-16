import defaultExport, { MapOption, loadCSS } from './BaseRenderer';
import { renderWith, renderByYamlWith, renderByScriptTargetWith } from './mapclay';
import { TerraDrawOpenLayersAdapter } from 'terra-draw'
loadCSS('https://cdn.jsdelivr.net/npm/ol@10.1.0/ol.css')

import * as ol from 'ol'
import * as control from 'ol/control';
import * as format from 'ol/format';
import * as geom from 'ol/geom';
import * as layer from 'ol/layer';
import * as source from 'ol/source';
import * as style from 'ol/style';
import * as proj from 'ol/proj';
import proj4 from 'proj4'
import * as olProj4 from 'ol/proj/proj4';


const Renderer = class extends defaultExport {
  id = 'openlayers'

  static validOptions = super.validOptions.concat([
    new MapOption({
      name: "proj",
      desc: "Projection of map view",
      example: "EPSG:3826",
      example_desc: "Taiwan TM2",
      isValid: (value) => value?.toString()?.match(/^EPSG:\d+$|^\d+$/) ? true : false
    }),
  ])

  static defaultConfig = Object.freeze({
    ...super.defaultConfig,
    proj: "EPSG:4326",
    control: {
      fullscreen: false,
      scale: false
    }
  })

  async createView(target) {
    super.createView(target)

    // Set projection
    proj4.defs("EPSG:3826", "+proj=tmerc +lat_0=0 +lon_0=121 +k=0.9999 +x_0=250000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs")
    olProj4.register(proj4);
    const defaultProjection = this.constructor.defaultConfig.proj
    const projString = this.validateOption('proj', this.config.proj)
      ? this.config.proj
      : (() => {
        console.warn(`Invalid projection: ${this.config.proj}, set ${defaultProjection} instead`)
        return defaultProjection
      })()
    const projection = await olProj4.fromEPSGCode(projString)
      .catch(() => {
        console.warn(`Fail to retrieve projection ${projString}, Use ${defaultProjection} instead`)
      })
    proj.setUserProjection(projection)

    // Set basemap and camera
    this.map = new ol.Map({
      target: target,
      view: new ol.View({
        constrainResolution: true,
        center: this.config.center,
        zoom: this.config.zoom,
      }),
    });

    this.setCursor()
    this.setControl()
    this.setData()

    return new Promise((resolve,) => {
      this.map.on('rendercomplete', () => {
        resolve(this.map)
      })
    }).then(() => {
      if (this.config.draw) {
        const adapter = new TerraDrawOpenLayersAdapter({
          lib: {
            Circle: geom.Circle,
            Feature: ol.Feature,
            GeoJSON: format.GeoJSON,
            Style: style.Style,
            VectorLayer: layer.Vector,
            VectorSource: source.Vector,
            Stroke: style.Stroke,
            CircleStyle: style.Circle,
            getUserProjection: proj.getUserProjection,
            fromLonLat: proj.fromLonLat,
            toLonLat: proj.toLonLat
          },
          map: this.map,
          coordinatePrecision: 9,
        })
        this.draw = this.setDrawComponent(adapter)
      }
      this.setExtra()
    })
  };

  setCursor() {
    const map = this.map
    map.getViewport().style.cursor = "grab";
    map.on('pointerdrag', (_) => {
      map.getViewport().style.cursor = "grabbing";
    });
    map.on('pointerup', () => {
      map.getViewport().style.cursor = "grab";
    });
  }

  handleAliases(options) {
    super.handleAliases(options)
    if (options.STYLE) {
      options.data.push({
        type: "style",
        url: options.STYLE
      })
      delete options.STYLE
    }
  }

  // Configure controls
  setControl() {
    const map = this.map
    const config = this.config
    if (config.control.fullscreen === true) {
      map.addControl(new control.FullScreen());
    }
    // TODO Add more options by config
    if (config.control.scale === true) {
      map.addControl(new control.ScaleLine({
        units: 'metric'
      }))
    }
  };

  // Configure extra stuff
  setExtra() {
    const map = this.map
    const config = this.config
    if (config.debug === true) {
      map.addLayer(
        new layer.Tile({
          source: new source.TileDebug(),
        })
      );
    }
    if (config.eval) {
      this.evalScript(config.eval, [
        ["foo", "bar"],
        ["map", map],
        ["ol", {
          ...ol,
          control,
          format,
          geom,
          layer,
          source,
          style,
          proj,
          proj4,
          olProj4,
        }]
      ])
    }
  };

  // Apply vector layer for markers onto map
  addMarkers = (markers) => markers.forEach(marker => {
    const element = document.createElement('div')
    element.innerHTML = this.svgForMarker
    element.title = marker.title
    element.classList.add('marker')

    const overlay = new ol.Overlay({
      element: element,
      position: marker.xy,
      positioning: 'bottom-center',
      anchor: [0.5, 1],
      stopEvent: false,
    })
    this.map.addOverlay(overlay)
  })

  addTileData(data) {
    const map = this.map
    const styleDatum = data.filter(datum => datum.type === 'style')[0]
    const tileData = data.filter(datum => datum.type === 'tile')
    if (!styleDatum && tileData.length === 0) {
      const baseLayer = new layer.Tile({
        source: new source.OSM(),
        title: 'OSM Carto'
      })
      map.addLayer(baseLayer)
    } else {
      tileData.forEach(datum => {
        const tileLayer = new layer.Tile({
          source: new source.XYZ({ url: datum.url }),
          title: datum.title ? datum.title : "Anonymous"
        })
        map.addLayer(tileLayer)
      })
    }

    // TODO Layers for WMTS
    const wmtsData = data.filter(datum => datum.type === 'wmts')[0]
    if (wmtsData) {
      // this.addLayersInWMTS(map, wmtsData)
    }
  }

  addGPXFile(gpxUrl) {
    const map = this.map
    const style = {
      'MultiLineString': new style.Style({
        stroke: new style.Stroke({
          color: 'red',
          width: 3,
        })
      })
    };

    map.addLayer(
      new layer.Vector({
        source: new source.Vector({
          url: gpxUrl,
          format: new format.GPX(),
        }),
        style: () => style['MultiLineString'],

      })
    );

    if (Object.prototype.hasOwnProperty.call(this.config, 'center')) {
      this.flyTo(map, { center: [10, 10], zoom: 10 })
    }
  }

  updateCamera(options, useAnimation) {
    const map = this.map
    const view = map.getView();
    if (useAnimation) {
      flyTo(map, { center: options.center, zoom: options.zoom })
    } else {
      view.animate({
        center: options.center,
        zoom: options.zoom,
        duration: 300
      })
    }
  }

  // FIXME Beaware of user projection in ol/proj
  project([x, y]) {
    return this.map.getPixelFromCoordinate([x, y])
  };
  unproject([x, y]) {
    return this.map.getCoordinateFromPixel([x, y])
  };
}

// Pan map to a specific location
function flyTo(map, status, done) {
  const duration = 2500;
  const view = map.getView();
  const nextZoom = status.zoom ? status.zoom : view.getZoom();
  const nextCenter = status.center ? status.center : view.center;

  let parts = 2;
  let called = false;
  function callback(complete) {
    --parts;
    if (called) return
    if (parts === 0 || !complete) {
      called = true;
      done(complete);
    }
  }

  // Move view to the given location
  view.animate(
    {
      center: nextCenter,
      duration: duration,
    },
    callback
  );
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
    callback
  );
}


const converter = config => ({ ...config, use: Renderer })
const render = renderWith(converter)
const renderByYaml = renderByYamlWith(converter)
const renderByScriptTarget = renderByScriptTargetWith(converter)

globalThis.mapclay = { render, renderByYaml }

export { render, renderByYaml, renderByScriptTarget }
export default Renderer
