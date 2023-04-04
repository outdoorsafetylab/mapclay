import defaultExport from './BaseRenderer.js';

export default class extends defaultExport {
  version = '2.4.0';

  resources = [
    `https://unpkg.com/maplibre-gl@${this.version}/dist/maplibre-gl.js`,
    `https://unpkg.com/maplibre-gl@${this.version}/dist/maplibre-gl.css`
  ]

  supportOptions = this.supportOptions.concat([
    "XYZ",
    "control.fullscreen",
    "control.scale",
    "mapbox.style",
    "maobox.accessToken",
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
    let style = 'https://demotiles.maplibre.org/style.json';
    if (config.XYZ) {
      style = {
        version: 8,
        sources: {
          image: { type: "raster", tiles: [config.XYZ], tileSize: 256 }
        },
        layers: [{ id: "image", type: "raster", source: "image" }]
      };
    }
    if (config.mapbox && config.mapbox.style) {
      style = config.mapbox.style;
    }

    let map = new maplibregl.Map({
      container: element,
      style: style,
      center: config.center,
      zoom: config.zoom -1 ,
      hash: config.link == true ? true : false
    });

    return map;
  };

  afterMapCreated(map, config){
    this.setInteraction(map, config);
    this.setControl(map, config);
    map.on('load', () => {
      this.setData(map, config);
      this.setExtra(map, config);
    });
  };

  // Configure interactions
  setInteraction(map, config) {
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

  addGPXFiles(map, gpxUrl) {
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
}
