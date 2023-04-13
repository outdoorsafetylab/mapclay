import defaultExport from './BaseRenderer.js';

export default class extends defaultExport {
  version = '1.9.3';

  resources = [
    `https://unpkg.com/leaflet@${this.version}/dist/leaflet.js`,
    `https://unpkg.com/leaflet@${this.version}/dist/leaflet.css`
  ]

  supportOptions = this.supportOptions.concat([
    "control.fullscreen",
    "control.scale",
    "GPX",
    "link",
    "debug"
  ])

  defaultConfig = Object.assign(this.defaultConfig, {
    control: {
      fullscreen: false,
      scale: false
    },
  })

  createMap(element, config) {
    // If Map Container is initialized, remove it
    if (element.map && element.map.remove) {
      element.map.off()
      element.map.remove()
    }
    delete element._leaflet_id

    const map = L.map(element).setView(Array.from(config.center).reverse(), config.zoom)

    return map;
  };

  // Configure interactions
  setInteraction(map, config) {
    // Set center of map
    if (config.link) {
      this.addPermalink(map);
    }

    super.setInteraction(map, config)
  };

  // Configure controls
  setControl(map, config){
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

  // Configure extra stuff
  setExtra(map, config) {
    if (config.debug == true) {
      L.GridLayer.GridDebug = L.GridLayer.extend({
        createTile: function (coords) {
          const tile = document.createElement('div');
          tile.style.outline = '2px solid';
          tile.style.fontWeight = 'bold';
          tile.style.fontSize = '14pt';
          tile.innerHTML = [coords.z, coords.x, coords.y].join('/');
          return tile;
        }
      });

      L.gridLayer.gridDebug = function (opts) {
        return new L.GridLayer.GridDebug(opts);
      };

      map.addLayer(L.gridLayer.gridDebug());
    }
    if (config.eval) {
      eval(config.eval);
    }
  };

  addMarkers(map, markers) {
    markers.forEach(marker => {
      let xy = Array.from(marker.xy).reverse()
      L.marker(xy).addTo(map)
        .bindPopup(marker.message)
    });
  }

  addTileData(map, tileData) {
    if (tileData.length == 0) {
      const osmTile = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
      L.tileLayer(osmTile).addTo(map);
    } else {
      tileData.forEach(datum => {
        const customTile = datum.url
        L.tileLayer(customTile).addTo(map);
      })
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

  addPermalink(map) {
    let script = document.createElement('script');
    script.src = "https://rawgit.com/MarcChasse/leaflet.Permalink/master/leaflet.permalink.min.js";
    document.body.append(script);
    script.onload = () => {
      L.Permalink.setup(map);
      var mappos = L.Permalink.getMapLocation(
        this.config.zoom, 
        Array.from(this.config.center).reverse()
      );
      map.setView(mappos.center, mappos.zoom)
    }
  }

  handleKey(map, code) {
    if (! super.handleKey(map, code)) { return; }

    let nextStatus = this.config.updates[this.at];
    let center = nextStatus.center ? nextStatus.center : map.getCenter().reverse();
    let zoom = nextStatus.zoom ? nextStatus.zoom : map.getZoom();
    this.updateCamera(map, { center: center, zoom: zoom }, true)
  }

  updateCamera(map, options, useAnimation) {
    let latLon = L.latLng(options.center[1], options.center[0])
    if (useAnimation) {
      map.flyTo(latLon, options.zoom);
    } else {
      map.setView(latLon, options.zoom);
    }
  }
}
