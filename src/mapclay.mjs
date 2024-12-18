import { load as yamlLoad, loadAll as yamlLoadAll } from 'js-yaml'

/**
 * Renderer: render target HTMLElement by step functions
 * @typedef {Object} Renderer
 * @property {Function[]} steps - functions for rendering
 * @property {HTMLElement} target - target HTMLElement
 */

/** VAR: List of Renderer for quickstart */
const defaultAliases = Object.freeze({
  use: {
    Leaflet: {
      value: './renderers/leaflet.mjs',
      url: 'https://github.com/outdoorsafetylab/mapclay/blob/HEAD/src/BasicLeafletRenderer.mjs',
      description:
        'Leaflet is the leading open-source JavaScript library for mobile-friendly interactive maps. It has all the mapping features most developers ever need.',
    },
    Maplibre: {
      value: './renderers/maplibre.mjs',
      url: 'https://github.com/outdoorsafetylab/mapclay/blob/HEAD/src/BasicMaplibreRenderer.mjs',
      description:
        'MapLibre GL JS is a TypeScript library that uses WebGL to render interactive maps from vector tiles in a browser. The customization of the map comply with the MapLibre Style Spec.',
    },
    Openlayers: {
      value: './renderers/openlayers.mjs',
      url: 'https://github.com/outdoorsafetylab/mapclay/blob/HEAD/src/BasicOpenlayersRenderer.mjs',
      description:
        'OpenLayers makes it easy to put a dynamic map in any web page. It can display map tiles, vector data and markers loaded from any source. OpenLayers has been developed to further the use of geographic information of all kinds.',
    },
  },
})

/**
 * applyDefaultAliases.
 *
 * @description just a single default converter for config
 * @param {Object} config -- original config
 * @return {Object} -- patched config
 */
const applyDefaultAliases = config => ({
  use: config.use ?? 'Leaflet',
  width: '100%',
  ...config,
  aliases: {
    ...defaultAliases,
    ...(config.aliases ?? {}),
  },
})

/**
 * parseConfigsFromYaml.
 *
 * @param {String} configText -- yaml text
 * @return {Object[]} -- List of config for rendering
 */
const parseConfigsFromYaml = configText => {
  const configList = []
  yamlLoadAll(configText, result => {
    if (typeof result === 'object' && !Array.isArray(result)) {
      configList.push(result ?? {})
    } else {
      if (configList.length > 0) {
        configList.at(-1).eval = result.toString()
      }
    }
  })

  return configList.length === 0
    ? [{}]
    : configList
}

/** VAR: Get config from other file by 'apply' */
const appliedConfigs = {}

/**
 * fetch remote config file and save it for cache
 *
 * @param {String} url -- url for remote config file
 */
const fetchConfig = async url => {
  if (!url || appliedConfigs[url]) return

  appliedConfigs[url] = await fetch(url)
    .then(response => {
      if (response.status !== 200) throw Error()
      return response.text()
    })
    .then(text => yamlLoad(text))
    .catch(err => {
      throw Error(`Fail to fetch applied config ${url}`, err)
    })
}

/**
 * Replace aliases in each property by property 'aliases'.
 * An alias must starts with upper-case
 *
 * @param {Object} config -- original config
 * @return {Object} patched config
 */
const setValueByAliases = config => {
  if (!config.aliases) return config

  Object.entries(config)
    .filter(
      ([option, value]) =>
        option !== 'aliases' &&
        typeof value === 'string' &&
        value.match(/^[A-Z]/),
    )
    .forEach(([key, alias]) => {
      const aliasResult = config.aliases?.[key]?.[alias]
      const aliasValue =
        typeof aliasResult === 'object' && !Array.isArray(aliasResult)
          ? aliasResult.value
          : aliasResult
      if (aliasValue) {
        config[key] = aliasValue
        if (key === 'use') {
          config.url = aliasResult.url
          config.desc = aliasResult.desc
        }
      }
    })

  return config
}

/**
 * applyOtherConfig.
 *
 * @param {Object} config -- original config for rendering
 * @return {Promise} -- resolve "patched" config
 */
const applyOtherConfig = async config => {
  if (!config.apply) return config

  await fetchConfig(config.apply)
  const preset = appliedConfigs[config.apply]
  if (!preset) throw Error('Fail to fetch remote config ' + config.aply)

  return {
    ...preset,
    ...config,
    aliases: {
      ...preset.aliases,
      ...(config.aliases ?? {}),
    },
  }
}

/**
 * prepareRenderer.
 *
 * @param {Object} config -- prepare renderer by properties in config
 * @return {Promise} -- resolve renderer used for rendering an HTMLElement
 */
const prepareRenderer = async config => {
  let renderer
  if (!config.use) {
    renderer = config
  } else if (config.use.steps) {
    renderer = config.use
  } else if (typeof config.use === 'function') {
    const RendererClass = config.use
    renderer = new RendererClass()
  } else if (typeof config.use === 'string') {
    const RendererClass = (await import(config.use)).default
    renderer = new RendererClass()
  } else {
    throw Error('Cannot get Renderer by config.use', config.use)
  }

  Object.entries(config).forEach(([key, value]) => (renderer[key] = value))
  return renderer
}

/**
 * healthCheck.
 * @description check Renderer is valid
 * @param {Renderer} renderer
 */
const healthCheck = renderer => {
  if (!renderer.steps) {
    renderer.steps = []
    throw Error('not health')
  }
  return renderer
}

/**
 * runBySteps.
 *
 * @param {Object} renderer -- for each function in property "steps",
 *   run them one by one and store result into property "results"
 * @return {Promise} -- chanined promises of function calls
 */
const runBySteps = renderer =>
  (renderer.steps ?? [])
    .reduce(
      (acc, func) =>
        acc
          .then(() => {
            if (renderer.results.at(-1).state === 'stop') {
              return { state: 'stop', reason: 'stop by previous step' }
            }
            // If dependencies not success, just skip this function
            if (func.depends) {
              const dependentResult = renderer.results.findLast(
                res => res.func === func.depends,
              )?.state
              if (dependentResult.match(/skip|fail/)) {
                return { state: 'skip' }
              }
            }

            // Run function binding with renderer
            return func.valueOf().bind(renderer)(renderer)
          })
          // Save non-fail result
          .then(result =>
            renderer.results.push({
              type: 'render',
              func: func.valueOf(),
              state: result?.state ?? 'success',
              result: result?.reason ?? result,
            }),
          )
          // Save fail result
          .catch(err =>
            renderer.results.push({
              type: 'render',
              func: func.valueOf(),
              state: 'fail',
              result: err,
            }),
          )
          // Do callback(If it exists) after each step
          .then(() => {
            renderer.stepCallback?.(renderer, renderer)
          }),
      Promise.resolve(),
    )
    .then(() => renderer)

/**
 * runByStepsForPrepare.
 * @description chain step functions for preparing Renderer
 * @param {Object} config
 */
const runByStepsForPrepare = (config) => {
  let renderer = config

  return steps => steps.reduce(
    (acc, step) =>
      acc
        .then(async () => {
          if (renderer.results.at(-1)?.state?.match(/fail|stop/)) {
            return { state: 'stop', reason: 'stop by previous step' }
          }
          renderer = await step(renderer)
          return renderer
        })
        // Save non-fail result
        .then(result =>
          renderer.results.push({
            type: 'prepare',
            func: step.valueOf(),
            state: result?.state ?? 'success',
            result: result?.reason ?? renderer,
          }),
        )
        .catch(err => {
          renderer.results.push({
            type: 'prepare',
            func: step.valueOf(),
            state: 'fail',
            result: err,
          })
        })
        .then(() => {
          renderer.prepareCallback?.(renderer, renderer.results)
        }),
    Promise.resolve(renderer),
  )
    .then(() => renderer)
}

/**
 * renderTargetWithConfig.
 *
 * @param {HTMLElement} target -- target element for map view
 * @param {Object} config -- options for map configuration
 * @return {Promise} promise -- which resolve value is a renderer,
     property "results" contains result objec of each step
 */
const renderWithConfig = async config => {
  // Prepare for rendering
  config.results = []

  const prepareSteps = [
    setValueByAliases,
    applyOtherConfig,
    setValueByAliases,
    prepareRenderer,
    healthCheck,
  ]

  const promise = runByStepsForPrepare(config)(prepareSteps)
    .then(renderer => runBySteps(renderer))
    .then(renderer => {
      const failToRender =
        !renderer.results ||
        renderer.results.length === 0 ||
        !renderer.results.find(r => r.state.match(/success/)) ||
        renderer.results.find(r => r.state.match(/fail|stop/))
      const attribute = failToRender ? 'unfulfilled' : 'fulfilled'
      renderer?.target?.setAttribute('data-render', attribute)

      return renderer
    })

  promise.valueOf = () => config.results

  return promise
}

/**
 * setValueOf.
 * @description apply valueOf for compare
 * @param {Object} config
 * @return {Object} config
 */
const setValueOf = config => {
  config.valueOf = () =>
    JSON.stringify(config, (k, v) =>
      k.match(/aliases|target/) ? undefined : v,
    )
  return config
}

/**
 * shouldRender.
 * @description should render current config, useful when config.target is a rendered map
 * @param {Object} config
 */
const shouldRender = config =>
  !(config.target instanceof window.HTMLElement) ||
  !config.target.classList.contains('mapclay') ||
  !(config.valueOf() === config.target.getAttribute('data-mapclay')) ||
  !(config.target.getAttribute('data-render') === 'fulfilled')

/**
 * renderWith
 * @param {HTMLElement} target Element of map(s) container
 * @param {Object[]|Object} configObj - Config(s) for each map. Scope into array if it is an Object
 * @param {Object} options - Valid optoins: "rendererList" (list of renderer info) and "renderer" (Class for renderer)
 * @returns {Promise} - Promise of rendering map(s) on target element
 */
const renderWith = converter => (element, configObj) => {
  // Get list of config file, no matter argument is Array or Object
  converter = converter ?? (config => config)
  const configListArray =
    typeof configObj === 'object'
      ? Array.isArray(configObj)
        ? configObj.map(converter)
        : [configObj].map(converter)
      : null
  if (!configListArray) throw Error(`Invalid config files: ${configObj}`)

  // Remove child elements but matches id in configList
  element.innerHTML = ''

  // Create elements for each config file in array
  const createContainer = config => {
    if (shouldRender(config)) {
      const target = document.createElement('div')
      if (config.id) {
        target.id = config.id.replaceAll('\x20', '_')
        target.title = `ID: ${target.id}`
      }
      target.classList.add('mapclay')
      config.target = target
      target.dataset.render = 'rendering'
      target.dataset.mapclay = config.valueOf()
    }
    element.append(config.target)

    if (window.CSS.supports(`width: ${config.width}`)) {
      config.target.style.width = config.width
    }
    if (window.CSS.supports(`height: ${config.height}`)) {
      config.target.style.height = config.height
    }

    return config
  }

  // List of promises about rendering each config
  return configListArray
    .map(setValueOf)
    .map(createContainer)
    .filter(shouldRender)
    .map(renderWithConfig)
}

/**
 * renderByYamlWith.
 *
 * @param {Function} converter - convert config to another config
 */
const renderByYamlWith = (converter = null) =>
  async (target, text = null) => {
    const yamlText = text ?? target.textContent
    const configList = parseConfigsFromYaml(yamlText)
    return renderWith(converter)(target, configList)
  }

/**
 * renderByScriptTargetWith.
 *
 * @param {Function} converter - convert config to another config
 */
const renderByScriptTargetWith = (converter = null) =>
  async () => {
    const script = document.currentScript
    const cssSelector =
      script?.getAttribute('data-target') ??
      URL.parse(script?.src)?.searchParams?.get('target')
    const containers = document.querySelectorAll(cssSelector)

    if (!cssSelector || !containers) return

    containers.forEach(target => renderByYamlWith(converter)(target))
  }

const render = renderWith(applyDefaultAliases)
const renderByYaml = renderByYamlWith(applyDefaultAliases)
const renderByScriptTarget = renderByScriptTargetWith(applyDefaultAliases)

if (document.currentScript) {
  globalThis.mapclay = { render, renderWith, renderByYaml, renderByYamlWith }
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
