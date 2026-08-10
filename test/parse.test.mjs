import { describe, it, expect } from 'vitest'
import { parseConfigsFromYaml, defaultAliases } from '../src/mapclay.mjs'

describe('parseConfigsFromYaml', () => {
  it('parses a single YAML document into one config', () => {
    const configs = parseConfigsFromYaml('use: Leaflet\nzoom: 7\n')
    expect(configs).toHaveLength(1)
    expect(configs[0]).toMatchObject({ use: 'Leaflet', zoom: 7 })
  })

  it('parses multiple documents separated by --- into an array', () => {
    const configs = parseConfigsFromYaml('use: Leaflet\n---\nuse: Maplibre\n')
    expect(configs).toHaveLength(2)
    expect(configs[0].use).toBe('Leaflet')
    expect(configs[1].use).toBe('Maplibre')
  })

  it('appends a trailing non-object document as eval on the previous config', () => {
    const configs = parseConfigsFromYaml('use: Leaflet\n---\n"map.setView([0, 0])"\n')
    expect(configs).toHaveLength(1)
    expect(configs[0].use).toBe('Leaflet')
    expect(configs[0].eval).toBe('map.setView([0, 0])')
  })

  it('returns [{}] for empty text', () => {
    expect(parseConfigsFromYaml('')).toEqual([{}])
  })
})

describe('defaultAliases', () => {
  it('is frozen and exposes the three bundled engines', () => {
    expect(Object.isFrozen(defaultAliases)).toBe(true)
    expect(Object.keys(defaultAliases.use)).toEqual([
      'Leaflet',
      'Maplibre',
      'Openlayers',
    ])
    expect(defaultAliases.use.Leaflet.value).toBe('./renderers/leaflet.mjs')
  })
})
