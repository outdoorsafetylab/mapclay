import { test, expect } from '@playwright/test'

// One happy-path render per engine: load the fixture, wait for the rendered
// map container to report data-render="fulfilled", and assert the
// engine-specific map root exists in the DOM.
const engines = [
  { name: 'Leaflet', fixture: '/e2e/fixtures/leaflet.html', root: '.leaflet-container' },
  { name: 'MapLibre', fixture: '/e2e/fixtures/maplibre.html', root: '.maplibregl-map' },
  { name: 'OpenLayers', fixture: '/e2e/fixtures/openlayers.html', root: '.ol-viewport' },
]

for (const { name, fixture, root } of engines) {
  test(`${name} renders a map (data-render=fulfilled)`, async ({ page }) => {
    await page.goto(fixture)

    const container = page.locator('#map .mapclay')
    await expect(container).toHaveAttribute('data-render', 'fulfilled', {
      timeout: 15_000,
    })
    await expect(page.locator(`#map ${root}`)).toBeVisible()
  })
}

// A well-formed but unresolvable crs (EPSG:999999) passes the crs regex but
// fails fromEPSGCode; setCoordinateSystem must rethrow so the render step fails
// and the container reports data-render="unfulfilled" rather than a broken map.
test('OpenLayers fails render on an unresolvable crs (data-render=unfulfilled)', async ({ page }) => {
  await page.goto('/e2e/fixtures/openlayers-bad-crs.html')

  const container = page.locator('#map .mapclay')
  await expect(container).toHaveAttribute('data-render', 'unfulfilled', {
    timeout: 15_000,
  })
})
