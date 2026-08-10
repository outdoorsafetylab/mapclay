import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderWith } from '../src/mapclay.mjs'

/**
 * Build a mock renderer usable as `config.use`. prepareRenderer accepts any
 * object with a `steps` array, so this drives the full prepare + run pipeline
 * without any real map library.
 */
const mockRenderer = (steps = []) => ({ steps })

/** Container element the pipeline renders into. */
const makeContainer = () => document.createElement('div')

/** Run the pipeline for a single config and resolve its renderer. */
const runConfig = async config => {
  const element = makeContainer()
  const [promise] = renderWith()(element, config)
  const renderer = await promise
  return { element, renderer }
}

/** States of only the 'render' step results (skip the 'prepare' phase). */
const renderStates = renderer =>
  renderer.results.filter(r => r.type === 'render').map(r => r.state)

describe('alias resolution', () => {
  it('replaces an uppercase-starting value via config.aliases', async () => {
    const { renderer } = await runConfig({
      use: mockRenderer(),
      center: 'Taipei',
      aliases: { center: { Taipei: [121, 25] } },
    })
    expect(renderer.center).toEqual([121, 25])
  })

  it('propagates url/desc for a resolved use alias', async () => {
    const { renderer } = await runConfig({
      use: 'Mock',
      aliases: {
        use: { Mock: { value: mockRenderer(), url: 'http://x', desc: 'hi' } },
      },
    })
    expect(renderer.url).toBe('http://x')
    expect(renderer.desc).toBe('hi')
  })
})

describe('apply merge', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('merges a fetched preset with config precedence', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ status: 200, text: async () => 'zoom: 12\nfoo: bar\n' })),
    )
    const { renderer } = await runConfig({
      use: mockRenderer(),
      apply: 'http://example.test/preset-ok.yml',
      zoom: 7,
    })
    expect(renderer.foo).toBe('bar') // from preset
    expect(renderer.zoom).toBe(7) // config wins over preset
  })

  it('marks the render unfulfilled when the preset fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ status: 500 })))
    const { element } = await runConfig({
      use: mockRenderer(),
      apply: 'http://example.test/preset-fail.yml',
    })
    expect(element.firstChild.getAttribute('data-render')).toBe('unfulfilled')
  })
})

describe('step skip / depends / stop', () => {
  it('skips a step whose dependency was skipped, without invoking it', async () => {
    const skipStep = () => ({ state: 'skip' })
    const dependentFn = vi.fn(() => 'ok')
    const { renderer } = await runConfig({
      use: mockRenderer([
        skipStep,
        { valueOf: () => dependentFn, depends: skipStep },
      ]),
    })
    expect(renderStates(renderer)).toEqual(['skip', 'skip'])
    expect(dependentFn).not.toHaveBeenCalled()
  })

  it('stops remaining steps after a step returns state "stop"', async () => {
    const stopStep = () => ({ state: 'stop' })
    const afterFn = vi.fn(() => 'ok')
    const { renderer, element } = await runConfig({
      use: mockRenderer([stopStep, afterFn]),
    })
    expect(renderStates(renderer)).toEqual(['stop', 'stop'])
    expect(afterFn).not.toHaveBeenCalled()
    expect(element.firstChild.getAttribute('data-render')).toBe('unfulfilled')
  })
})

describe('render outcome via data-render', () => {
  it('marks fulfilled when at least one step succeeds and none fail/stop', async () => {
    const okStep = vi.fn(() => 'done')
    const { renderer, element } = await runConfig({
      use: mockRenderer([okStep]),
    })
    expect(okStep).toHaveBeenCalled()
    expect(renderStates(renderer)).toContain('success')
    expect(element.firstChild.getAttribute('data-render')).toBe('fulfilled')
  })

  it('marks unfulfilled and records a fail when a step throws', async () => {
    const boom = () => {
      throw new Error('boom')
    }
    const { renderer, element } = await runConfig({
      use: mockRenderer([boom]),
    })
    expect(renderStates(renderer)).toContain('fail')
    expect(element.firstChild.getAttribute('data-render')).toBe('unfulfilled')
  })
})
