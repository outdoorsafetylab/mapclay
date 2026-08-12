import { describe, it, expect } from 'vitest'
import Renderer from '../src/BasicOpenlayersRenderer.mjs'

describe('openlayers crs validation', () => {
  it('throws on an invalid crs instead of silently falling back', async () => {
    const renderer = new Renderer()
    // crs is validated before ol/proj4 are touched, so no mocks are needed
    await expect(
      renderer.setCoordinateSystem({ crs: 'not-a-crs' }),
    ).rejects.toThrow(/Invalid Coordinate System/)
  })
})

describe('openlayers option aliases', () => {
  it('overrides the base setOptionAliases step so it runs in the pipeline', () => {
    const renderer = new Renderer()
    // The pipeline calls this.setOptionAliases; the OpenLayers override must
    // share that name (not setOptionsAliases) or its STYLE handling is skipped.
    expect(typeof renderer.setOptionAliases).toBe('function')
    expect(renderer.setOptionAliases).not.toBe(
      Object.getPrototypeOf(Object.getPrototypeOf(renderer)).setOptionAliases,
    )
  })

  it('turns a STYLE alias into a style data entry', () => {
    const renderer = new Renderer()
    const config = { aliases: {}, data: [], STYLE: 'https://example.com/s.json' }

    renderer.setOptionAliases(config)

    expect(config.STYLE).toBeUndefined()
    expect(config.data).toContainEqual({
      type: 'style',
      url: 'https://example.com/s.json',
    })
  })

  it('still runs the base alias handling (e.g. WMTS)', () => {
    const renderer = new Renderer()
    const config = { aliases: {}, data: [], WMTS: 'https://example.com/wmts' }

    renderer.setOptionAliases(config)

    expect(config.WMTS).toBeUndefined()
    expect(config.data).toContainEqual({
      type: 'wmts',
      url: 'https://example.com/wmts',
    })
  })
})
