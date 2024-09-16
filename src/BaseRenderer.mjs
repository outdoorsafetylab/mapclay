import { BasicDrawComponent, addSimpleSelector } from './BasicDrawComponent'

// Dynamically import CSS, simply add stylesheet at <head>
export const loadCSS = (url) => {
  if (document.head.querySelector(`link[href="${url}"]`)) return

  const link = document.createElement('link');
  Object.assign(link, {
    rel: 'stylesheet',
    href: url,
    onerror: () => console.warn('Fail to load stylesheet:', url)
  })
  document.head.appendChild(link);
}

// Class for valid options {{{
export class MapOption {
  constructor({ name, desc, example, example_desc, isValid }) {
    this.name = name;
    this.desc = desc;
    this.example = example
    this.example_desc = example_desc
    this.isValid = isValid
  }
  valueOf() {
    return this.name;
  }
}
// }}}

export default class {
  constructor(config = {}) {
    this.config = Object.setPrototypeOf(
      config,
      structuredClone(this.constructor.defaultConfig)
    )
    this.setOptionAliases()
  }

  validateOption(option, value) {
    const isValid = this.constructor.validOptions.find(opt => opt == option)?.isValid
    if (!isValid) throw Error(`Cannot find inValid method for option ${option}`)

    return isValid(value)
  }

  get map() {
    if (this._map === undefined) {
      throw Error("map is not set in current Renderer")
    }
    return this._map;
  }

  set map(value) {
    this._map = value;
  }

  // Valid Options {{{
  static validOptions = Object.freeze([
    new MapOption({
      name: "id",
      desc: "id of map HTML element",
      isValid: (value) => value?.match(/\w+/) ? true : false
    }),
    new MapOption({
      name: "width",
      desc: "CSS width of map HTML element",
      example: "200px",
      example_desc: "",
      isValid: (value) => CSS.supports(`width: ${value}`)
    }),
    new MapOption({
      name: "height",
      desc: "CSS height of map HTML element",
      example: "200px",
      example_desc: "",
      isValid: (value) => CSS.supports(`height: ${value}`)
    }),
    new MapOption({
      name: "center",
      desc: "Center of camera map, value: [lon, lat]",
      example: "[121, 24]",
      example_desc: "Center of Taiwan",
      isValid: (value) => {
        // TODO xy value other than WGS84
        try {
          const [x, y] = JSON.parse(value)
          return !isNaN(x) && !isNaN(y)
        } catch {
          return false
        }
      }
    }),
    new MapOption({
      name: "zoom",
      desc: "Zoom level for map camera, number between: 0-22",
      example: "7.0",
      example_desc: "Small country / US state",
      isValid: (value) => {
        const zoom = Number(value)
        return !isNaN(zoom) && zoom >= 0 && zoom <= 22
      }
    }),
    new MapOption({
      name: "control",
      desc: "Object of control options, supports: fullscreen, scale",
      example: "\n  scale: true",
      example_desc: "Add Scale bar",
      isValid: (value) => typeof value === 'object'
    }),
    new MapOption({
      name: "debug",
      desc: "Set true to show tile boundary",
      example: "true",
      example_desc: "",
      isValid: (value) => value === 'true'
    }),
    new MapOption({
      name: "XYZ",
      desc: "Raster tile format with {x}, {y} and {z}",
      example: "https://tile.openstreetmap.jp/styles/osm-bright/512/{z}/{x}/{y}.png",
      example_desc: "Tile from OSM Japan!",
      isValid: (value) => {
        return URL.parse(value) && value.includes('{x}') && value.includes('{y}') && value.includes('z')
      }
    }),
    new MapOption({
      name: "GPX",
      desc: "URL of GPX file",
      example: "https://raw.githubusercontent.com/openlayers/openlayers/main/examples/data/gpx/fells_loop.gpx",
      example_desc: "Example from topografix",
      isValid: (value) => URL.parse(value)
    }),
    new MapOption({
      name: "WMTS",
      desc: "URL of WMTS document",
      example: "https://gis.sinica.edu.tw/tileserver/wmts",
      example_desc: "SINICA Taiwan",
      isValid: (value) => URL.parse(value)
    }),
    new MapOption({
      name: "draw",
      desc: "Draw Something on map",
      example: "true",
      example_desc: "Enable Draw Tools",
      isValid: (value) => value === 'true'
    }),
    new MapOption({
      name: "eval",
      desc: "Custom Script",
      example: "console.log('this', this)",
      example_desc: "Print Renderer info",
      isValid: () => true
    }),
  ])
  // }}}
  // Default configuation for map {{{
  static defaultConfig = Object.freeze({
    width: "300px",
    height: "300px",
    center: [121, 24],
    zoom: 7,
    control: {
      scale: false,
      fullscreen: false
    },
    layers: [],
    data: [],
    aliases: [],
  })
  // }}}

  // Transform element contains config text into map
  async createView(target) {
    this.target = target
    target.style.width = this.config.width
    target.style.height = this.config.height
  }

  setDrawComponent = (adapter) => {
    const idPrefix = this.target?.id ? this.target.id + '-' : ""
    const options = {
      idStrategy: {
        isValidId: (_) => true,
        getId: (function() {
          let id = idPrefix + window.crypto.randomUUID()
          return function() {
            id = idPrefix + window.crypto.randomUUID()
            return id;
          };
        })()
      }
    }
    const draw = BasicDrawComponent(adapter, options)
    addSimpleSelector(this.target, draw, {
      idFilter: (feature) => feature.id.startsWith(idPrefix)
    });
    return draw
  }

  // Add GIS data
  setData() {
    const config = this.config
    // Tile
    this.addTileData(config.data.filter(record => record.type === 'tile'));

    // Set GPX file
    const gpxData = config.data.filter(record => record.type === 'gpx')
    if (gpxData.length !== 0) {
      gpxData.forEach(record => {
        this.addGPXFile(record.url)
      })
    }

    if (config.markers) {
      this.addMarkers(config.markers)
    }
  };

  // TODO Add containers for possible controls at top right
  // Add Control Options
  setControl() { };

  // Do extra stuff
  setExtra() { };

  // Update camera, like center or zoom level
  updateCamera() { };

  // Pixel <-> Coordinates
  project() { throw Error('not implemented')};
  unproject() { throw Error('not implemented')};

  // Import GPX files
  addTileData() { };

  // Import GPX files
  addGPXFile() { };

  setOptionAliases() {
    const config = this.config
    if (config.XYZ) {
      const xyzArray = typeof config.XYZ === 'string'
        ? [config.XYZ]
        : config.XYZ
      xyzArray.forEach((record) => {
        let obj;
        let url
        if (typeof record === 'string') {
          url = new URL(record)
          obj = {
            type: "tile",
            url: record,
            title: `${url.host}${url.pathname.split('%7B')[0]}`,
          }
        } else if (typeof record === 'object') {
          url = new URL(record.url)
          obj = {
            type: "tile",
            url: record.url,
            title: record.title ? record.title : `${url.host}${url.pathname.split('%7B')[0]}`
          }
        } else {
          return;
        }
        config.data.push(obj)
      })
      delete config.XYZ
    }

    if (config.WMTS) {
      config.data.push({
        type: "wmts",
        url: config.aliases[config.WMTS] ?? config.WMTS,
      })
      delete config.WMTS
    }

    if (config.GPX) {
      config.data.push({
        type: "gpx",
        url: config.GPX,
      })
      delete config.GPX
    }

    // Replace aliases into real string
    if (typeof config.center === 'string' && Object.prototype.hasOwnProperty.call(config.aliases, config.center)) {
      config.center = config.aliases[config.center]
    }
    config.data?.forEach(record => {
      if (Object.prototype.hasOwnProperty.call(config.aliases, record.url)) {
        record.title = record.url
        record.url = config.aliases[record.url]
      }
    })
  }

  showLayerSwitcher(data) {
    const wmtsRecords = data.filter(record => record.type === 'wmts')
    const tileRecords = data.filter(record => record.type === 'tile')

    return wmtsRecords.length > 0 || tileRecords.length > 1
  }

  propsForEval() {
    let currentPrototype = this;
    let props = [];
    let entries = [];
    while (currentPrototype !== Object.prototype) {
      props = props.concat(Object.getOwnPropertyNames(currentPrototype));
      entries = entries.concat(Object.entries(currentPrototype))
      currentPrototype = Object.getPrototypeOf(currentPrototype);
    }
    return props
  }

  evalScript(script, entries = []) {
    const props = this.propsForEval()
    const extraArgNames = entries.map(([key, _]) => key)
    const args = [
      ...props.map(prop => this[prop]),
      ...entries.map(([_, value]) => value)
    ]
    const func = Function([...props, ...extraArgNames], script)
      .bind(this, ...args)

    try {
      return func()
    } catch (err) {
      console.warn("Fail to run custom script:", err)
      return null
    }
  }

  svgForMarker = `<svg display="block" height="41px" width="27px" viewBox="0 0 27 41"><g fill-rule="nonzero"><g transform="translate(3.0, 29.0)" fill="#000000"><ellipse opacity="0.04" cx="10.5" cy="5.80029008" rx="10.5" ry="5.25002273"></ellipse><ellipse opacity="0.04" cx="10.5" cy="5.80029008" rx="10.5" ry="5.25002273"></ellipse><ellipse opacity="0.04" cx="10.5" cy="5.80029008" rx="9.5" ry="4.77275007"></ellipse><ellipse opacity="0.04" cx="10.5" cy="5.80029008" rx="8.5" ry="4.29549936"></ellipse><ellipse opacity="0.04" cx="10.5" cy="5.80029008" rx="7.5" ry="3.81822308"></ellipse><ellipse opacity="0.04" cx="10.5" cy="5.80029008" rx="6.5" ry="3.34094679"></ellipse><ellipse opacity="0.04" cx="10.5" cy="5.80029008" rx="5.5" ry="2.86367051"></ellipse><ellipse opacity="0.04" cx="10.5" cy="5.80029008" rx="4.5" ry="2.38636864"></ellipse></g><g fill="#3FB1CE"><path d="M27,13.5 C27,19.074644 20.250001,27.000002 14.75,34.500002 C14.016665,35.500004 12.983335,35.500004 12.25,34.500002 C6.7499993,27.000002 0,19.222562 0,13.5 C0,6.0441559 6.0441559,0 13.5,0 C20.955844,0 27,6.0441559 27,13.5 Z"></path></g><g opacity="0.25" fill="#000000"><path d="M13.5,0 C6.0441559,0 0,6.0441559 0,13.5 C0,19.222562 6.7499993,27 12.25,34.5 C13,35.522727 14.016664,35.500004 14.75,34.5 C20.250001,27 27,19.074644 27,13.5 C27,6.0441559 20.955844,0 13.5,0 Z M13.5,1 C20.415404,1 26,6.584596 26,13.5 C26,15.898657 24.495584,19.181431 22.220703,22.738281 C19.945823,26.295132 16.705119,30.142167 13.943359,33.908203 C13.743445,34.180814 13.612715,34.322738 13.5,34.441406 C13.387285,34.322738 13.256555,34.180814 13.056641,33.908203 C10.284481,30.127985 7.4148684,26.314159 5.015625,22.773438 C2.6163816,19.232715 1,15.953538 1,13.5 C1,6.584596 6.584596,1 13.5,1 Z"></path></g><g transform="translate(6.0, 7.0)" fill="#FFFFFF"></g><g transform="translate(8.0, 8.0)"><circle fill="#000000" opacity="0.25" cx="5.5" cy="5.5" r="5.4999962"></circle><circle fill="#FFFFFF" cx="5.5" cy="5.5" r="5.4999962"></circle></g></g></svg>`.trim()
}
