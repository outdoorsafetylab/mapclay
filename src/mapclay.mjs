import { load as yamlLoad, loadAll as yamlLoadAll } from 'js-yaml';

// Renderer list for quick start {{{
const dir = new URL('./', import.meta.url)
const defaultAliases = Object.freeze({
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
  config.aliases = { ...defaultAliases, ...(config.aliases ?? {}) }
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

  if (configList.length === 0) throw Error('Not a valid config file')

  return configList
}
// }}}
// Get config from other file by 'apply' {{{
const appliedConfigs = {}

const fetchConfig = async (url) => {
  if (appliedConfigs[url]) return

  appliedConfigs[url] = fetch(url)
    .then(response => {
      if (response.status !== 200) throw Error()
      return response.text()
    })
    .then(text => yamlLoad(text))
    .catch((err) => { throw Error(`Fail to fetch applied config ${url}`, err) })
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
const isClass = (C) => typeof C === "function" && C.prototype !== undefined
const getRendererClass = async (config) => {
  const rendererUrl = config.use ?? Object.values(config.aliases?.use)?.at(0)?.value
  if (!rendererUrl) throw Error(`Renderer URL is not specified ${rendererUrl}`)

  return (await import(rendererUrl).catch((err) => {
    throw Error(`Fail to import renderer by URL ${rendererUrl}: ${err}`)
  })).default
}

/**
 * renderTargetWithConfig.
 *
 * @param {HTMLElement} target -- target element for map view
 * @param {Object} config -- options for map configuration
 * @return {Object} renderer -- object responsible for rendering, check property "result" for details
 */
const renderTargetWithConfig = async (target, config) => {
  // In case config.apply is using alias
  setValueByAliases(config)
  if (config.apply) {
    try {
      fetchConfig(config.apply)
      const preset = await appliedConfigs[config.apply]
      config = { ...preset, ...config }
    } catch (err) {
      console.warn(err)
    }
  }
  setValueByAliases(config)

  // Get renderer
  const rendererClass = isClass(config.use)
    ? config.use
    : await getRendererClass(config)
  if (!rendererClass) throw Error(`Fail to get renderer class by module ${config.use}`)
  const renderer = new rendererClass()

  Object.entries(config)
    .forEach(([key, value]) => renderer[key] = value)

  // Run functions
  renderer.results = []
  target.renderer = renderer
  // TODO Save passed arguments for each function
  renderer.run.reduce((acc, func) => acc
    .then(() => {
      // If dependencies not success, just skip this function
      if (func.depends) {
        const dependentResult = renderer.results
          .findLast(res => res.func === func.depends)
          ?.state
        if (['skip', 'fail'].includes(dependentResult)) {
          return { state: 'skip' }
        }
      }

      // Run function binding with renderer
      return func.valueOf().bind(renderer)(renderer)
    })
    // Save non-fail result
    .then((result) => renderer.results.push({
      func: func.valueOf(),
      state: result.state ? result.state : 'success',
      result
    }))
    // Save fail result
    .catch(err => renderer.results.push({
      func: func.valueOf(),
      state: 'fail',
      result: err,
    })),
    Promise.resolve()
  )

  return renderer
}
// }}}
// Render target by config {{{
/**
 * @param {HTMLElement} target Element of map(s) container
 * @param {Object[]|Object} configObj - Config(s) for each map. Scope into array if it is an Object
 * @param {Object} options - Valid optoins: "rendererList" (list of renderer info) and "renderer" (Class for renderer)
 * @returns {Promise} - Promise of rendering map(s) on target element
 */
const renderWith = (converter) => (element, configObj) => {
  // Get list of config file, no matter argument is Array or Object
  converter = converter ?? (config => config)
  const configListArray = typeof configObj === 'object'
    ? Array.isArray(configObj) ? configObj.map(converter) : [configObj].map(converter)
    : null
  if (!configListArray) throw Error(`Invalid config files: ${configObj}`)

  // Remove elements not related to maps
  const idList = configListArray.map(c => c.id).filter(c => c)
  element.innerText = ''
  Array.from(element.children)
    .filter(e => !idList.includes(e.id))
    .forEach(e => e.remove())

  // Create elements for each config file in array
  const createContainer = (config) => {
    const elementWithSameId = document.getElementById(config.id)
    const target = elementWithSameId
      ? elementWithSameId
      : document.createElement('div')
    if (config.id) {
      target.id = config.id
      target.title = config.id
    }
    target.style.position = 'relative'
    target.classList.add('map-container')
    element.append(target)
    return { target, config }
  }

  // List of promises about rendering each config
  return configListArray
    .map(createContainer)
    .map(pair => {
      const { target, config } = pair
      return {
        target,
        config: JSON.parse(JSON.stringify(config)),
        promise: renderTargetWithConfig(target, config)
      }
    })
}
// }}}
// Render target element by textContent {{{
const renderByYamlWith = (converter = null) => async (target, text = null) => {
  const yamlText = text ?? target.textContent
  const configList = parseConfigsFromYaml(yamlText)
  return renderWith(converter)(target, configList)
}
// }}}
// Render target by <script> tag only {{{
const renderByScriptTargetWith = (converter = null) => async () => {
  const script = document.currentScript
  const cssSelector = script?.getAttribute('data-target')
    ?? URL.parse(script?.src)?.searchParams?.get("target")
  const containers = document.querySelectorAll(cssSelector)

  if (!cssSelector || !containers) return

  containers.forEach(target => renderByYamlWith(converter)(target))
}
// }}}

const render = renderWith(applyDefaultAliases)
const renderByYaml = renderByYamlWith(applyDefaultAliases)
const renderByScriptTarget = renderByScriptTargetWith(applyDefaultAliases)

if (document.currentScript) {
  globalThis.mapclay = { render, renderByYaml }
}

export {
  defaultAliases,
  parseConfigsFromYaml,
  render,
  renderWith,
  renderByYaml,
  renderByYamlWith,
  renderByScriptTarget,
  renderByScriptTargetWith,
}
