export default class {

  // Resources about Script or CSS file
  resources = new Set();

  supportOptions = [
    "use",
    "width",
    "height",
    "center",
    "zoom",
    "updates",
    "XYZ",
    "GPX",
  ]

  // Default configuation for map 
  defaultConfig = {
    width: "300px",
    height: "300px",
    center: [121, 24],
    zoom: 7,
    updates: [],
    data: [],
  }

  // Used for animation
  at = 0

  // Get list of necessary resources 
  appendResources(config) { return this.resources }

  // Import modules based on config
  importModules(config){};
  // Create map object
  createMap(element, config){};
  // After map object is created, apply configurations
  afterMapCreated(map, config) {
    this.setData(map, config);
    this.setInteraction(map, config);
    this.setControl(map, config);
    this.setExtra(map, config);
  };
  // Add Interaction Options
  setInteraction(map, config){
    const renderer = this
    window.addEventListener('keydown', function(e){
      renderer.handleKey(map, config, e.keyCode)
    })
  };
  // Add Control Options
  setControl(map, config){};
  // Add GIS data
  setData(map, config){
    // Tile
    this.addTileData(map, config.data);

    // Set GPX file
    const gpxData = config.data.filter(datum => datum.type == 'gpx')
    if (gpxData.length != 0) {
      gpxData.forEach(datum => {
        this.addGPXFile(map, datum.url)
      })
    }

    if (config.markers) {
      this.addMarkers(map, config.markers)
    }
  };
  // Do extra stuff
  setExtra(map, config){};

  // Update camera, like center or zoom level
  updateCamera(map, options, useAnimation){};

  // Import GPX files
  addTileData(map, tileData) {};

  // Import GPX files
  addGPXFile(map, gpxUrl) {};

  // Handle key events
  handleKey(map, config, code) {
    if (config.updates.length < 2) { return false; }

    if (code == 78) { 
      ++this.at;
      if (this.at == config.updates.length) { this.at = 0; }
    }
    else if (code == 80) { 
      --this.at; 
      if (this.at == -1) { this.at = config.updates.length - 1; }
    }
    else { return false; }

    return true
  }

  // Clean original content
  // And pretty-print config at a new <div> upon map
  printConfig = (mapElement, config) => {
    mapElement.innerHTML = ''
    let configDiv = document.createElement('div');
    configDiv.innerHTML = `
      <details>
        <summary>CONFIG</summary>
        <pre>${enumerateProps(config)}<pre>
      </details>
    `;
    mapElement.parentNode.insertBefore(configDiv, mapElement);
  }

  handleAliases(options) {
    if (!options.data) { options.data = [] }

    if (options.XYZ) {
      const xyzArray = typeof options.XYZ == 'string'
        ? [ options.XYZ ]
        : options.XYZ
      xyzArray.forEach((record, index) => {
        var obj;
        if (typeof record == 'string') {
          obj = {
            type: "tile",
            url: record,
            title: `Anonymous_${index}`,
          }
        } else if (typeof record == 'object') {
          obj = {
            type: "tile",
            url: record.url,
            title: record.title ? record.title : `Anonymous_${index}`,
          }
        } else {
          return;
        }
        options.data.push(obj)
      })
      delete options.XYZ
    }

    if (options.GPX) {
      options.data.push({
        type: "gpx",
        url: options.GPX,
      })
      delete options.GPX
    }

    // Replace aliases into real string
    if (typeof options.center == 'string' && options.aliases.hasOwnProperty(options.center)) {
      options.center = options.aliases[options.center]
    }
    options.updates.forEach(record => {
      if (typeof record.center == 'string' && options.aliases.hasOwnProperty(record.center)) {
        record.center = options.aliases[record.center]
      }
    })
    options.data.forEach(record => {
      if (options.aliases.hasOwnProperty(record.url)) {
        record.title = record.url
        record.url = options.aliases[record.url]
      }
    })
  }

  // Transform element contains config text into map
  async renderMap(element) {
    // Remove all childs
    element.replaceChildren([])

    // Set width/height for div
    element.style.width = element.config.width;
    element.style.height = element.config.height;

    // Set current center/zoom as the first element of updates[]
    element.config.updates.unshift({ 
      center: element.config.center, 
      zoom: element.config.zoom 
    })
    // If some options are missing in an update, use previous one's
    element.config.updates.forEach((update, index) => {
      if (! update.center) { update.center = element.config.updates[index - 1].center }
      if (! update.zoom) { update.zoom = element.config.updates[index - 1].zoom }
    })

    // Configure Map
    await this.importModules(element.config);
    const map = this.createMap(element, element.config);
    element.map = map // Used to check element is already a map container
    this.afterMapCreated(map, element.config);
  }
}

function enumerateProps(obj, initial = ''){
  let content = '' + initial
  for (const prop in obj) {
    let val = obj[prop]
    if (typeof val === 'object' && ! Array.isArray(val)){
      content += `${prop}:\n`
      content += enumerateProps(val, '  ')
    } else {
      content += `${prop}: ${obj[prop]}\n`
    }
  }

  return content
}
