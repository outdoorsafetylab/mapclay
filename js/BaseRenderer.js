export default class {

  // Resources about Script or CSS file
  resources = [];

  // Default configuation for map 
  defaultConfig = {
    width: "300px",
    height: "300px",

    center: [121, 24],
    zoom: 7,

    control: { 
      fullscreen: false 
    },
    debug: false
  }

  // Import modules based on config
  importModules(config){};
  // Create map object
  createMap(element, config){};
  // After map object is created, apply configurations
  afterMapCreated(map, config){
    this.setInteraction(map, config);
    this.setControl(map, config);
    this.setData(map, config);
    this.setExtra(map, config);
  };
  // Add Interaction Options
  setInteraction(map, config){};
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
    // To prevent necessary configs are not defined
    if (! element.config.hasOwnProperty('preset')) {
      Object.setPrototypeOf(element.config, this.defaultConfig)
    }

    // Print map config
    //this.printConfig(element, element.config);

    // Set width/height for div
    element.style.width = element.config.width;
    element.style.height = element.config.height;

    // Configure Map
    await this.importModules(element.config);
    const map = this.createMap(element, element.config);
    element.map = map
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
