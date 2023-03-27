import 'https://cdnjs.cloudflare.com/ajax/libs/js-yaml/4.1.0/js-yaml.min.js';

const rendererInfo = Object.freeze({
  openlayers: './BasicOpenlayersRenderer.js', 
  leaflet:    './BasicLeafletRenderer.js',
  maplibre:   './BasicMaplibreRenderer.js'
});

function loadResource(url) {
  return new Promise(function(resolve, reject) {
    if (url.endsWith('.js')) {
      let script = document.createElement('script');
      script.src = url;
      script.async = false;
      script.onload = function() {
        resolve(url);
      };
      script.onerror = function() {
        reject(url);
      };
      document.head.appendChild(script);
    } else if (url.endsWith('.css')) {
      let link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      link.onload = function() {
        resolve(url);
      };
      link.onerror = function() {
        reject(url);
      };
      document.head.appendChild(link);
    }
  });
}

// Get related script tag and its parent element
const currentScript = Array.from(document.querySelectorAll("script"))
  .find(script => script.src == import.meta.url);
const parentElement = currentScript.parentElement;

// Use targetSelector to get elements which will render maps
let targetSelector = currentScript.dataset.to;
targetSelector ??= ".map";
const targetElements = Array.from(parentElement.querySelectorAll(targetSelector));

// Use fromSelector to get elements which contains config text
let fromSelector = currentScript.dataset.from;
fromSelector ??= targetSelector; 
const fromElements = Array.from(parentElement.querySelectorAll(fromSelector));

// Set of map renders in config texts
const usedRenderers = new Set();

// Get config from elements
function assignConfig() {
  fromElements.forEach(function (element, index) {
    const config = jsyaml.load(element.value ?? element.textContent) ?? {};

    // If preset is define, apply previous config as prototype
    if (index != 0 && config.hasOwnProperty("preset") && config.preset == "last") {
      let lastConfig = targetElements[index - 1].config
      Object.setPrototypeOf(config, lastConfig);
    }

    // Set use with default value (if not set)
    if (! config.use) {
      config.use = Object.keys(rendererInfo)[0]
    }

    // Apply config onto element
    targetElements[index].config = config;

    usedRenderers.add(config.use);
  })
}

/* For each map renderer:
   1. Load related methods in renderer file
   2. Put scripts and CSS into DOM
   3. Render maps which use this renderer */

async function refreshMap() {
  assignConfig()

  for (let rendererName of usedRenderers) {
    // TODO handle undefined renderer
    let renderer = new (await import(rendererInfo[rendererName])).default();

    let shouldRenderElements = targetElements.filter(ele => 
          ele.config.use == rendererName
    )

    // Set widow.renderer as current used renderer
    if (shouldRenderElements.length > 0) {
      window.renderer = renderer
    }

    let promises = [];

    renderer.resources.forEach((url) => {
      promises.push(loadResource(url));
    });

    Promise.all(promises)
      .then(function() {
        // After map renderer script is loaded, render maps
        shouldRenderElements.forEach(ele => {
          renderer.renderMap(ele);
          ele.dispatchEvent(new Event('map-rendered'));
        });
      }).catch(function(script) {
        console.log(script + ' failed to load');
      });
  }
}

refreshMap()

export { refreshMap };
window.refreshMap = refreshMap
