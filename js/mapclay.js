import 'https://cdnjs.cloudflare.com/ajax/libs/js-yaml/4.1.0/js-yaml.min.js';

const scriptName = 'mapclay.js'

const rendererInfo = Object.freeze({
  openlayers: './BasicOpenlayersRenderer.js', 
  leaflet:    './BasicLeafletRenderer.js',
  maplibre:   './BasicMaplibreRenderer.js'
});

function loadResource(url) {
  return new Promise(function(resolve, reject) {
    if (url.endsWith('.js')) {
      let script = document.createElement('script');
      Object.assign(script, {
        src: url,
        async: false,
        onload: function() {
          resolve(url);
        },
        onerror: function() {
          reject(url);
        },
      })
      document.head.appendChild(script);
    } else if (url.endsWith('.css')) {
      let link = document.createElement('link');
      Object.assign(link, {
        rel: 'stylesheet',
        href: url,
        onload: function() {
          resolve(url);
        },
        onerror: function() {
          reject(url);
        },
      })
      document.head.appendChild(link);
    }
  });
}

// Get related script tag and its parent element
const currentScript = Array.from(document.querySelectorAll("script"))
  .find(script => script.src.endsWith(scriptName) );
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

function loadOptions(rawText) {
  let text = rawText.replace(/^\s*\n+/, '');
  const paragraphs = text.split(/\n\s*\n/);
  text = paragraphs[0];

  const evaltext = paragraphs.length > 1 ? paragraphs.slice(1).join("\n\n") : undefined;
  const optionsObj = jsyaml.load(text) ?? {};
  if (evaltext) {
    optionsObj.eval = evaltext;
  }

  return optionsObj;
}

// Get config from elements
async function assignConfig() {
  return Promise.all(fromElements.map(async (element, index) => {
    let config = loadOptions(element.value ?? element.textContent)

    // If preset is define, apply previous config as prototype
    if (config.hasOwnProperty("preset")) {
      if (index != 0 && config.preset == "last") {
        // Apply last element's config as preset
        let lastConfig = targetElements[index - 1].config
        Object.setPrototypeOf(config, lastConfig);
      } else {
        // Fetch remote resource as preset
        const response = await fetch(config.preset)
        const text = await response.text()
        const presetObj = loadOptions(text)
        if (presetObj.eval) {
          config.eval = presetObj.eval + "\n" + config.eval
        }
        config = Object.assign({}, presetObj, config)
      }
    }

    // Set use with default value (if not set)
    if (! config.use) {
      config.use = Object.keys(rendererInfo)[0]
    }

    // Apply config onto element
    targetElements[index].config = config;

    // Append necessary renderer
    usedRenderers.add(config.use);
  }))
}

/* For each map renderer:
   1. Load related methods in renderer file
   2. Put scripts and CSS into DOM
   3. Render maps which use this renderer */

async function refreshMap() {
  await assignConfig()

  for (let rendererName of usedRenderers) {
    // TODO handle undefined renderer
    let renderer = new (await import(rendererInfo[rendererName])).default();

    // Get elements which this renderer applys on
    let shouldRenderElements = targetElements.filter(ele => 
      ele.config.use == rendererName
    )
    shouldRenderElements.forEach( ele => {
      // If config has no prototype, apply defautConfig
      // This prevents necessary configs are not defined
      Object.setPrototypeOf(ele.config, renderer.defaultConfig)
      renderer.handleAliases(ele.config)
      renderer.appendResources(ele.config)
    })

    // Set widow.renderer as current used renderer
    if (shouldRenderElements.length > 0) {
      window.renderer = renderer
    } else {
      continue
    }

    // Load necessary resources
    let promises = [];
    renderer.resources.forEach(url => {
      promises.push(loadResource(url));
    });

    Promise.all(promises).then(function() {
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
window.loadOptions = loadOptions
