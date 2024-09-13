import { load as yamlLoad, loadAll as yamlLoadAll } from 'js-yaml';

// Renderer list for quick start {{{
const dir = new URL('./', import.meta.url)
const defaultAliasesForRenderer = Object.freeze({
  "use": {
    "Leaflet": {
      value: dir + 'renderers/leaflet.mjs',
      description: 'Leaflet is the leading open-source JavaScript library for mobile-friendly interactive maps. It has all the mapping features most developers ever need.',
    },
    "Maplibre": {
      value: dir + 'renderers/maplibre.mjs',
      description: 'MapLibre GL JS is a TypeScript library that uses WebGL to render interactive maps from vector tiles in a browser. The customization of the map comply with the MapLibre Style Spec.',
    },
    "Openlayers": {
      value: dir + 'renderers/openlayers.mjs',
      description: 'OpenLayers makes it easy to put a dynamic map in any web page. It can display map tiles, vector data and markers loaded from any source. OpenLayers has been developed to further the use of geographic information of all kinds.',
    },
  }
});
const applyDefaultAliases = (config) => {
  config.aliases = { ...defaultAliasesForRenderer, ...(config.aliases ?? {}) }
  return config
}
// }}}
// Parse yaml content with raw text {{{
const parseConfigsFromYaml = (configText) => {
  const configList = []
  yamlLoadAll(
    configText,
    (result) => {
      if (typeof result === 'object' && !Array.isArray(result)) {
        configList.push(result ?? {})
      } else {
        if (configList.length > 0) {
          configList.at(-1).eval = result.toString()
        }
      }
    }
  )

  if (configList.length == 0) throw Error('Not a valid config file')

  return configList
}
// }}}
// Get config from other file by 'apply' {{{
const appliedConfigs = {}

const fetchConfig = (url) => fetch(url)
  .then(res => res.text())
  .then(text => {
    const config = yamlLoad(text)
    appliedConfigs[url] = config
  })
  .catch((err) => { throw Error(`Fail to fetch applied config ${url}`, err) })

const applyOtherConfig = (configList) => (config) => {
  if (!config.apply) return config
  const appliedConfig = configList[config.apply]

  return { ...(appliedConfig ?? {}), ...config }
}
// }}}
// Set option value by aliases {{{
const setValueByAliases = (config) => {
  if (!config.aliases) return config

  Object.entries(config)
    .filter(([option, value]) =>
      option !== 'aliases' &&
      typeof value === 'string' &&
      value.match(/^[A-Z]/)
    )
    .forEach(([key, alias]) => {
      const aliasResult = config.aliases?.[key]?.[alias]
      const aliasValue = typeof aliasResult === 'object' && !Array.isArray(aliasResult)
        ? aliasResult.value
        : aliasResult
      if (aliasValue) config[key] = aliasValue
    })

  return config
}
// }}}
// Render each map container by config {{{
const renderTargetWithConfig = async ([target, config]) => {

  const getRendererClass = async (c) => {
    const rendererUrl = c.use ?? Object.values(c.aliases?.use)?.at(0)?.value
    if (!rendererUrl) throw Error(`Renderer URL is not specified ${rendererUrl}`)

    return (await import(rendererUrl).catch((err) => {
      throw Error(`Fail to import renderer by URL ${rendererUrl}: ${err}`)
    })).default
  }

  const rendererClass = typeof config.use === 'function'
    ? config.use
    : await getRendererClass(config)
  if (!rendererClass) throw Error(`Fail to get renderer class by module ${config.use}`)

  const renderer = new rendererClass(config)
  target.renderer = renderer
  // TODO Refactor this method by view created and callback
  await renderer.createView(target)

  return target
}
// }}}
// Render target by config {{{
/**
 * @param {HTMLElement} target Element of map(s) container
 * @param {Object[]|Object} configObj - Config(s) for each map. Scope into array if it is an Object
 * @param {Object} options - Valid optoins: "rendererList" (list of renderer info) and "renderer" (Class for renderer)
 * @returns {Promise} - Promise of rendering map(s) on target element
 */
const renderWith = (preset) => async (target, configObj) => {
  // Return List of promises about map rendering
  const configListArray = typeof configObj === 'object'
    ? Array.isArray(configObj) ? configObj : [configObj]
    : null
  if (!configListArray) throw Error("Invalid config files", configObj)
  configListArray.forEach(config => Object.assign(config, preset))

  // Fetch config files by option "apply"
  configListArray.forEach(setValueByAliases)
  const getAppliedConfigs = configListArray
    .filter(config => config.apply)
    .map(config => config.apply)
    .map(fetchConfig)
  await Promise.all(getAppliedConfigs)

  // TODO call remove methods in renderer for each rendered element
  // Remove children from target container
  Array.from(target.children).forEach(e => e.remove())
  target.innerHTML = ''

  // Create elements for each config file in array
  const createContainer = (config) => {
    const mapContainer = document.createElement('div')
    target.appendChild(mapContainer)
    if (config.id) {
      mapContainer.id = config.id
      mapContainer.title = config.id
    }
    mapContainer.style.setProperty('position', 'relative')
    mapContainer.classList.add('map-container')
    return [mapContainer, config]
  }

  // List of promises about rendering each config
  const renderByEachConfig = configListArray
    .map(applyOtherConfig(appliedConfigs))
    .map(applyDefaultAliases)
    .map(setValueByAliases)
    .map(createContainer)
    .map(renderTargetWithConfig)

  return Promise.allSettled(renderByEachConfig)
}
// }}}
// Render target element by textContent {{{
const renderByYamlWith = (preset) => async (target, text = null) => {
  const yamlText = text ?? target.textContent
  const configList = parseConfigsFromYaml(yamlText)
  return renderWith(preset)(target, configList)
}
// }}}
// Render target by <script> tag only {{{
const renderByScriptTargetWith = (preset) => async () => {
  const script = document.currentScript
  const cssSelector = script?.getAttribute('data-target')
    ?? URL.parse(script?.src)?.searchParams?.get("target")
  const containers = document.querySelectorAll(cssSelector)

  if (!cssSelector || !containers) return

  containers.forEach(target => renderByYamlWith(preset)(target))
}
// }}}

const render = renderWith(null)
const renderByYaml = renderByYamlWith(null)
const renderByScriptTarget = renderByScriptTargetWith(null)

if (document.currentScript) {
  globalThis.mapclay = { render, renderByYaml }
}

export {
  defaultAliasesForRenderer,
  parseConfigsFromYaml,
  render,
  renderWith,
  renderByYaml,
  renderByYamlWith,
  renderByScriptTarget,
  renderByScriptTargetWith,
}
