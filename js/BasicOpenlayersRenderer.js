import defaultExport from './BaseRenderer.js';

export default class extends defaultExport {
  version = '7.3.0';

  resources = [
    `https://cdn.jsdelivr.net/npm/ol@${this.version}/dist/ol.js`,
    `https://cdn.jsdelivr.net/npm/ol@${this.version}/ol.css`
  ]

  async importModules(config) {
    if (config.mapbox) {
      await import('https://unpkg.com/ol-mapbox-style@9.4.0/dist/olms.js');
    }
  } 

  createMap(element, config) {
    // Set projection to WGS84
    ol.proj.useGeographic();

    // Add class for popup
    this.definePopup();

    // Set base layer by config
    var baseLayer;

    if (config.XYZ) {
      baseLayer = new ol.layer.Tile({
        source: new ol.source.XYZ({ url: config.XYZ }) 
      })
    } else if (config.mapbox) {
      // do nothing
    } else {
      baseLayer = new ol.layer.Tile({
        source: new ol.source.OSM()
      })
    }

    // Set basemap and camera
    const map = new ol.Map({
      layers: baseLayer ? [ baseLayer ] : [],
      target: element,
      view: new ol.View({
        constrainResolution: true,
        center: config.center,
        zoom: config.zoom
      }),
    });

    if (config.mapbox) {
      olms.apply(
        map, 
        config.mapbox.style,
        {
          accessToken: config.mapbox.accessToken
        }
      );
    }

    return map;
  };

  // Configure interactions
  setInteraction(map, config) {
    // Set Interactions
    if (config.link == true) {
      map.addInteraction(
        new ol.interaction.Link()
      );
      map.getView().animate({
        zoom: config.zoom,
        center: config.center
      });
    }

    super.setInteraction(map, config)
  };

  // Configure controls
  setControl(map, config) {
    if (config.control.fullscreen == true) {
      map.addControl(new ol.control.FullScreen());
    }
    // TODO Add more options by config
    if (config.control.scale == true) {
      map.addControl(new ol.control.ScaleLine({
        units: 'metric'
      }))
    }
  };

  // Configure extra stuff
  setExtra(map, config) {
    if (config.debug == true) {
      map.addLayer(
        new ol.layer.Tile({
          source: new ol.source.TileDebug(),
        })
      );
    }
    if (config.eval) {
      eval(config.eval)
    }
  };

  // Apply vector layer for markers onto map
  addMarkers(map, markers) {
    let features = markers.map(marker => 
      new ol.Feature({ 
        geometry: new ol.geom.Point(marker.xy),
        name: marker.message
      })
    )
    let markerSource = new ol.source.Vector({ features: features });
    const clusterSource = new ol.source.Cluster({ source: markerSource });
    const clusters = new ol.layer.Vector({
      source: clusterSource,
      style: (feature) => {
        const size = feature.get('features').length;
        const image = size == 1
          ? new ol.style.Icon({
            opacity: 1,
            img: this.defaultMarkerImage(),
            imgSize:[30, 30],
            anchor: [0.5, 1],
            scale: 1.4
          })
          : new ol.style.Circle({
            radius: 10,
            stroke: new ol.style.Stroke({
              color: '#fff',
            }),
            fill: new ol.style.Fill({
              color: '#3399CC',
            }),
          })
        const text = size == 1 
          ? null 
          : new ol.style.Text({
            text: size.toString(),
            fill: new ol.style.Fill({
              color: '#fff',
            }),
          })

        return new ol.style.Style({
          image: image,
          text: text
        });
      },
    });
    map.addLayer(clusters);

    this.addPopup(map)
  }

  defaultMarkerImage() {
    let svg = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="30px" height="30px" viewBox="0 0 30 30" enable-background="new 0 0 30 30">
                 <path fill="#156BB1" d="M22.906,10.438c0,4.367-6.281,14.312-7.906,17.031c-1.719-2.75-7.906-12.665-7.906-17.031S10.634,2.531,15,2.531S22.906,6.071,22.906,10.438z"/>
                 <circle fill="#FFFFFF" cx="15" cy="10.677" r="3.291"/>
               </svg>`;
    let marker = new Image();
    marker.src = `data:image/svg+xml,${encodeURIComponent(svg)}`
    return marker;
  }

  addGPXFiles(map, gpxUrl) {
    const style = {
      'MultiLineString': new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: 'red',
          width: 3,
        })
      })
    };

    map.addLayer(
      new ol.layer.Vector({
        source: new ol.source.Vector({
          url: gpxUrl,
          format: new ol.format.GPX(),
        }),
        style: function (feature) {
          return style['MultiLineString'];
        },
      })
    );
  }

  definePopup() {
    ol.Overlay.Popup = class Popup extends ol.Overlay {

      constructor(opt_options) {
        var options = opt_options || {};

        if (options.autoPan === undefined) {
          options.autoPan = true;
        }

        if (options.autoPanAnimation === undefined) {
          options.autoPanAnimation = {
            duration: 250
          };
        }

        var element = document.createElement('div');
        options.element = element;
        super(options);

        this.container = element;
        this.container.className = 'ol-popup';

        this.closer = document.createElement('a');
        this.closer.className = 'ol-popup-closer';
        this.closer.href = '#';
        this.container.appendChild(this.closer);

        var that = this;
        this.closer.addEventListener('click', function(evt) {
          that.container.style.display = 'none';
          that.closer.blur();
          evt.preventDefault();
        }, false);

        this.content = document.createElement('div');
        this.content.className = 'ol-popup-content';
        this.container.appendChild(this.content);

        // Apply workaround to enable scrolling of content div on touch devices
        Popup.enableTouchScroll_(this.content);
      }

      /**
       * Show the popup.
       * @param {ol.Coordinate} coord Where to anchor the popup.
       * @param {String|HTMLElement} html String or element of HTML to display within the popup.
       * @returns {Popup} The Popup instance
       */
      show(coord, html) {
        if (html instanceof HTMLElement) {
          this.content.innerHTML = "";
          this.content.appendChild(html);
        } else {
          this.content.innerHTML = html;
        }
        this.container.style.display = 'block';
        this.content.scrollTop = 0;
        this.setPosition(coord);
        return this;
      }

      /**
       * @private
       * @desc Determine if the current browser supports touch events. Adapted from
       * https://gist.github.com/chrismbarr/4107472
       */
      static isTouchDevice_() {
        try {
          document.createEvent("TouchEvent");
          return true;
        } catch(e) {
          return false;
        }
      }

      /**
       * @private
       * @desc Apply workaround to enable scrolling of overflowing content within an
       * element. Adapted from https://gist.github.com/chrismbarr/4107472
       */
      static enableTouchScroll_(elm) {
        if(Popup.isTouchDevice_()){
          var scrollStartPos = 0;
          elm.addEventListener("touchstart", function(event) {
            scrollStartPos = this.scrollTop + event.touches[0].pageY;
          }, false);
          elm.addEventListener("touchmove", function(event) {
            this.scrollTop = scrollStartPos - event.touches[0].pageY;
          }, false);
        }
      }

      /**
       * Hide the popup.
       * @returns {Popup} The Popup instance
       */
      hide() {
        this.container.style.display = 'none';
        return this;
      }

      /**
       * Indicates if the popup is in open state
       * @returns {Boolean} Whether the popup instance is open
       */
      isOpened() {
        return this.container.style.display == 'block';
      }
    };

    const popupCSS = `
      .ol-popup {
        position: absolute;
        background-color: white;
        box-shadow: 0 1px 4px rgba(0,0,0,0.2);
        padding: 15px;
        border-radius: 10px;
        border: 1px solid #cccccc;
        bottom: 12px;
        left: -50px;
        min-width: 280px;
      }
      .ol-popup:after, .ol-popup:before {
        top: 100%;
        border: solid transparent;
        content: " ";
        height: 0;
        width: 0;
        position: absolute;
        pointer-events: none;
      }
      .ol-popup:after {
        border-top-color: white;
        border-width: 10px;
        left: 48px;
        margin-left: -10px;
      }
      .ol-popup:before {
        border-top-color: #cccccc;
        border-width: 11px;
        left: 48px;
        margin-left: -11px;
      }
      .ol-popup-closer {
        text-decoration: none;
        position: absolute;
        top: 2px;
        right: 8px;
      }
      .ol-popup-closer:after {
        content: "×";
      }
      .ol-popup-content {
        font-size: 12px;
      }
    `
    document.head.appendChild(document.createElement("style")).innerHTML=popupCSS;
  }

  addPopup(map) {
    let popup = new ol.Overlay.Popup();
    map.addOverlay(popup);
    map.on('singleclick', function(evt) {
      const feature = map.forEachFeatureAtPixel(evt.pixel, function (feature) {
        let features = feature.get('features');
        return features ? features[0] : null
      });
      if (feature){
        popup.show(evt.coordinate, feature.get('name'));
      } else {
        popup.hide()
      }
    });
  }

  handleKey(map, code) {
    if (! super.handleKey(map, code)) { return; }

    let nextStatus = this.config.steps[this.at]
    flyTo(map, nextStatus, function(){})
  }
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
    if (called) {
      return;
    }
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
      zoom: (view.getZoom() + nextZoom) /2 -1,
      duration: duration / 2,
    },
    {
      zoom: nextZoom,
      duration: duration / 2,
    },
    callback
  );
}
