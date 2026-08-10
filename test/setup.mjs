// jsdom does not implement the CSS namespace; the render pipeline probes
// window.CSS.supports before applying width/height. Provide a minimal stub.
if (!window.CSS) window.CSS = {}
if (typeof window.CSS.supports !== 'function') {
  window.CSS.supports = value => typeof value === 'string' && !/undefined/.test(value)
}
