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
    this.setOptionAliases(this.config)
  }

  // Valid Options {{{
  static validOptions = Object.freeze([
    new MapOption({
      name: "id",
      desc: "id of map HTML element",
      isValid: (value) => value.match(/\w+/)
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
          return !isNaN(x) && !isNaN(y) && x <= 180 && x >= -180 && y <= 90 && y >= -90
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
      example: "https://www.topografix.com/fells_loop.gpx",
      example_desc: "Example from topografix",
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
    const draw = BasicDrawComponent(adapter, this.target.id)
    addSimpleSelector(this.target, draw)
    return draw
  }

  // Add GIS data
  setData(map, config) {
    // Tile
    this.addTileData(map, config.data.filter(d => d.type === 'tile'));

    // Set GPX file
    const gpxData = config.data.filter(datum => datum.type === 'gpx')
    if (gpxData.length !== 0) {
      gpxData.forEach(datum => {
        this.addGPXFile(map, datum.url)
      })
    }

    if (config.markers) {
      this.addMarkers(map, config.markers)
    }
  };

  // TODO Add containers for possible controls at top right
  // Add Control Options
  setControl() { };

  // Do extra stuff
  setExtra() { };

  // Update camera, like center or zoom level
  updateCamera() { };

  // Import GPX files
  addTileData() { };

  // Import GPX files
  addGPXFile() { };

  setOptionAliases(config) {
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
}
