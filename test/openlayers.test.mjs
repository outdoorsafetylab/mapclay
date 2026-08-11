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
