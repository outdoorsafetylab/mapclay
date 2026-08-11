import { describe, it, expect } from 'vitest'
import BaseRenderer from '../src/BaseRenderer.mjs'

/** Look up an option's isValid predicate from the static option list. */
const isValidFor = name =>
  BaseRenderer.validOptions.find(opt => opt.valueOf() === name).isValid

describe('XYZ tile-URL validation', () => {
  const isValidXYZ = isValidFor('XYZ')

  it('accepts a URL with {x}, {y} and {z} placeholders', () => {
    expect(
      isValidXYZ('https://tile.example.com/512/{z}/{x}/{y}.png'),
    ).toBeTruthy()
  })

  it('rejects a URL that contains the letter z but no {z} placeholder', () => {
    // "zoom" contains a bare 'z'; without the {z} placeholder it must fail
    expect(
      isValidXYZ('https://zoom.example.com/tiles/{x}/{y}.png'),
    ).toBeFalsy()
  })
})
