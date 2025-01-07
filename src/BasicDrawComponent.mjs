/** Import */
import {
  TerraDraw,
  TerraDrawSelectMode,
  TerraDrawPointMode,
  TerraDrawLineStringMode,
  TerraDrawPolygonMode,
  TerraDrawCircleMode,
  TerraDrawRectangleMode,
  TerraDrawRenderMode,
} from 'terra-draw'

/**
 * BasicDrawComponent.
 * ref: https://github.com/JamesLMilner/terra-draw/blob/main/guides/4.MODES.md#selection-mode
 * @param {TerraDrawBaseAdapter} adapter
 * @param {Object} options
 * @return TerraDratxw
 */
export const BasicDrawComponent = (adapter, options = {}) =>
  new TerraDraw({
    adapter,
    modes: [
      new TerraDrawSelectMode({
        modename: 'modify',
        flags: {
          render: {
            feature: {
              // draggable: true,
              coordinates: {
                midpoints: true,
                draggable: true,
                deletable: true,
                validation: () => true,
              },
            },
          },
        },
      }),
      new TerraDrawPointMode(),
      new TerraDrawLineStringMode(),
      new TerraDrawPolygonMode(),
      new TerraDrawCircleMode(),
      new TerraDrawRectangleMode(),
      new TerraDrawRenderMode({
        modeName: 'render',
        // TODO More styles by feature properties
        styles: {
          pointColor: 'red',
          pointOutlineWidth: 2,
          lineStringColor: 'red',
          lineStringWidth: 2,
          polygonFillColor: '#00FFFF',
          polygonFillOpacity: 0,
          polygonOutlineColor: 'red',
          polygonOutlineWidth: 2,
        },
      }),
    ],
    ...options,
  })

/**
 * getUtils.
 *
 * @param {HTMLElement} target
 * @param {TerraDraw} draw
 * @param {Object} options
 */
export const getUtils = (target, draw, options = {}) => {
  draw.start()
  draw.setMode('render')

  // Resume drawn features
  const storageId = target.id
    ? `terra-draw-data-${target.id}`
    : 'terra-draw-data'
  const featureData = window.localStorage.getItem(storageId)
  if (featureData) {
    try {
      const features = JSON.parse(featureData)
      features.forEach(f => (f.properties = { mode: 'render' }))
      draw.addFeatures(features)
    } catch (err) {
      console.warn(
        'Fail to drawn features from Local Storage.',
        featureData,
        err,
      )
      window.localStorage.removeItem(storageId)
    }
  }

  const cursorHolder = target.querySelector('canvas') ?? target
  cursorHolder.style.removeProperty('cursor')
  const features = draw.getSnapshot()

  new window.MutationObserver(() => {
    switch (target.dataset.draw) {
      case '':
      case undefined:
        draw.setMode('render')
        break
      case 'modify':
        draw.setMode('select')
        break
      case 'delete':
        draw.setMode('render')
        cursorHolder.style.cursor = 'not-allowed'
        break
      case 'clear':
        window.localStorage.removeItem(storageId)
        target.dataset.draw = ''
        draw.clear()
        break
      case 'features':
        window.alert(
          `${features.length} features\n\n${JSON.stringify(features, null, 4)}`,
        )
        break
      default:
        draw.setMode(target.dataset.draw)
        break
    }
  }).observe(target, {
    attributes: true,
    attributeFilter: ['data-draw'],
  })

  draw.on('change', () => { })
  draw.on('finish', (id, context) => {
    if (context.action === 'draw') {
      const feature = draw.getSnapshot().find(feature => feature.id === id)
      if (feature) {
        draw.removeFeatures([id])
        feature.properties.mode = 'render'
        draw.addFeatures([feature])
      }
    }

    const idFilter = options.idFilter ?? (() => true)
    const features = draw.getSnapshot().filter(idFilter)
    window.localStorage.setItem(storageId, JSON.stringify(features))

    if (context.mode !== 'point' && context.action === 'draw') {
      target.dataset.draw = ''
    }
  })
  document.onclick = event => {
    if (target.dataset.draw === 'delete') {
      const features = draw.getFeaturesAtPointerEvent(event, {
        pointerDistance: 40,
      })
      if (features.length > 0) {
        draw.removeFeatures([features[0].id])
        if (draw.getSnapshot().length === 0) {
          target.dataset.draw = ''
        }
      }
    }
  }
}
