import 'https://cdnjs.cloudflare.com/ajax/libs/js-yaml/4.1.0/js-yaml.min.js';

const AdapterUrl = Object.freeze({
  openlayers: './descriptor-openlayers.js', 
  leaflet:    './descriptor-leaflet.js',
  maplibre:   './descriptor-maplibre.js'
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
let targetSelector = currentScript.dataset.target;
targetSelector ??= ".map";
const targetElements = Array.from(parentElement.querySelectorAll(targetSelector));

// Use fromSelector to get elements which contains config text
let fromSelector = currentScript.dataset.from;
fromSelector ??= targetSelector; 
const fromElements = Array.from(parentElement.querySelectorAll(fromSelector));

// Set of map viewers in config texts
const viewers = new Set();

// Get config from elements
fromElements.forEach(function (element, index) {
  const config = jsyaml.load(element.textContent) ?? {};

  if (index != 0 && config.hasOwnProperty("preset") && config.preset == "last") {
    let lastConfig = targetElements[index - 1].config
    Object.setPrototypeOf(config, lastConfig);
  }
  targetElements[index].config = config;
  viewers.add(config.viewer);
})

/* For each map viewer:
   1. Load related methods in adapter file
   2. Put scripts and CSS into DOM
   3. Render maps which use this viewer */
for (let viewer of viewers) {
  // TODO handle undefined viewer
  let adapter = new (await import(AdapterUrl[viewer])).default();

  let promises = [];

  adapter.resources.forEach((url) => {
	promises.push(loadResource(url));
  });

  Promise.all(promises)
    .then(function() {
      // After map viewer script is loaded, render maps
      targetElements.filter(ele => 
        ele.config.viewer == viewer
      ).forEach(ele => {
        adapter.renderMap(ele);
      });
    }).catch(function(script) {
      console.log(script + ' failed to load');
    });
}
