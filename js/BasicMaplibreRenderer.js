import defaultExport from './BaseRenderer.js';

export default class extends defaultExport {
  version = '2.4.0';

  resources = [
    `https://unpkg.com/maplibre-gl@${this.version}/dist/maplibre-gl.js`,
    `https://unpkg.com/maplibre-gl@${this.version}/dist/maplibre-gl.css`
  ]

  supportOptions = this.supportOptions.concat([
    "control.fullscreen",
    "control.scale",
    "STYLE",
    "GPX",
    "link",
    "debug",
  ])

  defaultConfig = Object.assign(this.defaultConfig, {
    control: {
      fullscreen: false,
      scale: false
    },
  })

  createMap(element, config) {
    const styleDatum = config.data.filter(datum => datum.type == 'style')[0];
    const tileData = config.data.filter(datum => datum.type == 'tile');
    
    var style;
    if (styleDatum) {
      style = styleDatum.url
    } else if (tileData.length != 0 ){
      style = {
        version: 8,
        sources: {},
        layers: [],
      }
    } else {
      style = 'https://demotiles.maplibre.org/style.json'
    }

    let map = new maplibregl.Map({
      container: element,
      style: style,
      hash: config.link == true ? true : false,
      center: config.center,
      zoom: config.zoom,
    });

    return map;
  };

  handleAliases() {
    super.handleAliases()
    if (this.config.STYLE) {
      this.config.data.push({
        type: "style",
        url: this.config.STYLE
      })
    }
  }

  afterMapCreated(map, config){
    this.setInteraction(map, config);
    this.setControl(map, config);
    map.on('load', () => {
      this.setData(map, config)
      this.setExtra(map, config);
    });
  };

  // Configure interactions
  setInteraction(map, config) {
    super.setInteraction(map, config)
  };

  // Configure controls
  setControl(map, config){
    if (config.control.fullscreen == true) {
      map.addControl(new maplibregl.FullscreenControl());
    }
    if (config.control.scale == true) {
      let scale = new maplibregl.ScaleControl({
        unit: 'metric'
      });
      map.addControl(scale);
    }
  };

  // Configure extra stuff
  setExtra(map, config) {
    if (config.debug == true) {
      map.showTileBoundaries = true;
    }
    if (config.eval) {
      eval(config.eval)
    };
  };

  addMarkers(map, markers) {
    markers.forEach(marker => {
      let popup = new maplibregl.Popup()
        .setText(marker.message)
        .setMaxWidth("300px")
      new maplibregl.Marker()
        .setLngLat(marker.xy)
        .setPopup(popup)
        .addTo(map);
    });
  }

  addTileData(map, tileData) {
    const style = map.getStyle();
    tileData.forEach((datum, index) => {
      const source = datum.name ? datum.name : index.toString() 
      style.sources[source] = { type: "raster", tiles: [datum.url], tileSize: 256 }
      style.layers.push({ id: source, type: "raster", source: source})
    })
    map.setStyle(style)
  }

  addGPXFile(map, gpxUrl) {
    let script = document.createElement('script');
    script.src = "https://loc8.us/maplibre-gl-vector-text-protocol/dist/maplibre-gl-vector-text-protocol.js";
    document.body.append(script);

    script.onload = () => {
      VectorTextProtocol.addProtocols(maplibregl);

      const gpxSourceName = 'gpx';
      const gpxLink = 'gpx://' + gpxUrl;

      map.addSource(gpxSourceName, {
        'type': 'geojson',
        'data': gpxLink,
      });
      map.addLayer({
        'id': "id_" + gpxSourceName,
        'type': 'line',
        'source': gpxSourceName,
        'paint': {
          'line-color': 'red',
          'line-width': 3
        }
      });
    };
  }

  handleKey(map, code) {
    if (! super.handleKey(map, code)) { return; }

    let nextStatus = this.config.updates[this.at];
    let center = nextStatus.center ? nextStatus.center : map.getCenter().reverse();
    let zoom = nextStatus.zoom ? nextStatus.zoom : map.getZoom();
    this.updateCamera(map, { center: center, zoom: zoom }, true)
  }

  updateCamera(map, options, useAnimation) {
    if (useAnimation) {
      map.flyTo({ 
        center: options.center,
        zoom: options.zoom
      })
    } else {
      map.setCenter(options.center)
      map.setZoom(options.zoom)
    }
  }
}
