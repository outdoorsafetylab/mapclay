export default class {

  // Resources about Script or CSS file
  resources = [];

  supportOptions = [
    "use",
    "width",
    "height",
    "center",
    "zoom",
    "updates"
  ]

  // Default configuation for map 
  defaultConfig = {
    width: "300px",
    height: "300px",
    center: [121, 24],
    zoom: 7,
    updates: []
  }

  // Used for animation
  at = 0

  // Import modules based on config
  importModules(config){};
  // Create map object
  createMap(element, config){};
  // After map object is created, apply configurations
  afterMapCreated(map, config) {
    this.updateCamera(map, config, false)
    this.setInteraction(map, config);
    this.setControl(map, config);
    this.setData(map, config);
    this.setExtra(map, config);
  };
  // Add Interaction Options
  setInteraction(map, config){
    const renderer = this
    window.addEventListener('keydown', function(e){
      renderer.handleKey(map, e.keyCode)
    })
  };
  // Add Control Options
  setControl(map, config){};
  // Add GIS data
  setData(map, config){
    if (config.markers) {
      this.addMarkers(map, config.markers)
    }

    if (config.GPX) {
      this.addGPXFiles(map, config.GPX)
    }
  };
  // Do extra stuff
  setExtra(map, config){};

  // Update camera, like center or zoom level
  updateCamera(map, options, useAnimation){};

  // Handle key events
  handleKey(map, code) {
    if (this.config.updates.length < 2) { return false; }

    if (code == 78) { 
      ++this.at;
      if (this.at == this.config.updates.length) { this.at = 0; }
    }
    else if (code == 80) { 
      --this.at; 
      if (this.at == -1) { this.at = this.config.updates.length - 1; }
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

  // Transform element contains config text into map
  async renderMap(element) {
    // Remove all childs
    element.replaceChildren([])

    // If config has no prototype, apply defautConfig
    // This prevents necessary configs are not defined
    if (! element.config.hasOwnProperty('preset')) {
      Object.setPrototypeOf(element.config, this.defaultConfig)
    }

    // Set width/height for div
    element.style.width = element.config.width;
    element.style.height = element.config.height;

    this.config = element.config;

    // Set current center/zoom as the first element of updates[]
    this.config.updates.unshift({ 
      center: this.config.center, 
      zoom: this.config.zoom 
    })
    // If some options are missing, use previous one's
    this.config.updates.forEach((update, index) => {
      if (! update.center) { update.center = this.config.updates[index - 1].center }
      if (! update.zoom) { update.zoom = this.config.updates[index - 1].zoom }
    })

    // Configure Map
    await this.importModules(this.config);
    const map = this.createMap(element, this.config);
    element.map = map // Used to check element is already a map container
    this.afterMapCreated(map, this.config);
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
