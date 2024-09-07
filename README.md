[![npm version](https://badge.fury.io/js/mapclay.svg)](https://badge.fury.io/js/mapclay)

## Quick Start

### The minimal use cases

The following use cases are valid in modern browsers:

Add script from CDN, and specify **CSS selector** for target HTML element by
- **data attribute** `data-target`
- **query paremeter** `target`

[Try it out](https://markdown-it.github.io/#md3=%7B%22source%22%3A%22%3Cdiv%20id%3D%27map%27%3E%3C%2Fdiv%3E%5Cn%3Cscript%20src%3D%27https%3A%2F%2Funpkg.com%2Fmapclay%40latest%2Fdist%2Fmapclay.js%3Ftarget%3D%2523map%27%3E%3C%2Fscript%3E%5Cn%22%2C%22defaults%22%3A%7B%22html%22%3Atrue%2C%22xhtmlOut%22%3Afalse%2C%22breaks%22%3Afalse%2C%22langPrefix%22%3A%22%22%2C%22linkify%22%3Atrue%2C%22typographer%22%3Afalse%2C%22_highlight%22%3Afalse%2C%22_strict%22%3Afalse%2C%22_view%22%3A%22html%22%7D%7D) with online markdown editor

```html
<!-- Target all <pre> elements
<pre></pre>
<script data-target="pre" src='https://unpkg.com/mapclay@latest/dist/mapclay.js'></script>

<!-- Or... -->

<!-- Target all elements with 'id="map"', selector '#map' in URL encoding is '%23map'
<div id='map'></div>
<script src='https://unpkg.com/mapclay@latest/dist/mapclay.js?target=%23map'></script>
```

<br>

The text content of target element would be parsed as [YAML](https://nodeca.github.io/js-yaml/), So user can specify [options](#options) to configure map.

[Try it out](https://markdown-it.github.io/#md3=%7B%22source%22%3A%22%60%60%60map%5Cnuse%3A%20Maplibre%5Cnwidth%3A%20400px%5Cnheight%3A%2050vh%5Cncenter%3A%20%5B139.6917%2C35.6895%5D%5Cnzoom%3A%208%5CnXYZ%3A%20https%3A%2F%2Ftile.openstreetmap.jp%2Fstyles%2Fosm-bright%2F512%2F%7Bz%7D%2F%7Bx%7D%2F%7By%7D.png%5Cn%60%60%60%5Cn%5Cn%3Cscript%20src%3D%27http%3A%2F%2Funpkg.com%2Fmapclay%40latest%2Fdist%2Fmapclay.js%3Ftarget%3Dpre%27%3E%3C%2Fscript%3E%22%2C%22defaults%22%3A%7B%22html%22%3Atrue%2C%22xhtmlOut%22%3Afalse%2C%22breaks%22%3Afalse%2C%22langPrefix%22%3A%22%22%2C%22linkify%22%3Atrue%2C%22typographer%22%3Afalse%2C%22_highlight%22%3Afalse%2C%22_strict%22%3Afalse%2C%22_view%22%3A%22html%22%7D%7D)

```html
<pre>
use: Maplibre
width: 400px
height: 50vh
center: [139.6917,35.6895]
zoom: 8
XYZ: https://tile.openstreetmap.jp/styles/osm-bright/512/{z}/{x}/{y}.png
</pre>

<script src='https://unpkg.com/mapclay@latest/dist/mapclay.js?target=pre'></script>
```

<br>

All selected target elements would be rendered:

[Try it out](https://markdown-it.github.io/#md3=%7B%22source%22%3A%22%60%60%60map%5Cnuse%3A%20Leaflet%5Cnwidth%3A%20400px%5Cnheight%3A%2050vh%5Cncenter%3A%20%5B139.6917%2C35.6895%5D%5Cnzoom%3A%208%5CnXYZ%3A%20https%3A%2F%2Ftile.openstreetmap.jp%2Fstyles%2Fosm-bright%2F512%2F%7Bz%7D%2F%7Bx%7D%2F%7By%7D.png%5Cn%60%60%60%5Cn%5Cn%3Cscript%20src%3D%27https%3A%2F%2Funpkg.com%2Fmapclay%40latest%2Fdist%2Fmapclay.js%3Ftarget%3Dpre%27%3E%3C%2Fscript%3E%22%2C%22defaults%22%3A%7B%22html%22%3Atrue%2C%22xhtmlOut%22%3Afalse%2C%22breaks%22%3Afalse%2C%22langPrefix%22%3A%22%22%2C%22linkify%22%3Atrue%2C%22typographer%22%3Afalse%2C%22_highlight%22%3Afalse%2C%22_strict%22%3Afalse%2C%22_view%22%3A%22html%22%7D%7D)


```html
<pre>use: Leaflet</pre>
<pre>use: Maplibre</pre>
<pre>use: Openlayers</pre>

<script src='https://unpkg.com/mapclay@latest/dist/mapclay.js?target=pre'></script>
```

<br>

### API calls

If **target** is not given by `<script>` tag, render would not be automatically executed.
Here comes API:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Play with mapclay</title>
    <meta charset='utf-8'>
    <script src='https://unpkg.com/mapclay@latest/dist/mapclay.js'></script>
</head>
<body>
<pre id="map">
<!-- ...Options here! -->
</pre>
<script>
//...Lets coding!
</script>
</body>
</html>
```

### Render by text content

Still, write text content on target element for options:

```html
<!-- In HTML body -->
<pre id="map">
width: 400px
height: 400px
center: [139.6917,35.6895]
zoom: 8
</pre>
```

Use `mapclay.renderByTextContent()` for this case

```js
// In <script>
const target = document.querySelector('#map')
mapclay.renderByTextContent(target)
```

### Render by config object

Despite of text content, you can manually specify options by config object

```js
// In <script>
const target = document.querySelector('#map')

mapclay.render(target, {
  width: 400px,
  height: 400px,
  center: [139.6917,35.6895]
  zoom: 8
})
```

<br>

## Options

### Common Options

Except of `use`, `aliases` and `apply`, no options are strictly defined. Valid optoins are depends on [Renderer](#renderer) (which is specified by `use`).

But there are some general optoins come with [default Renderers](#default-renderers):

option|description|value
---|---|---|
id | id of map HTML element | `String`
width |  CSS width of map HTML element | `String` for CSS
height | CSS height of map HTML element | `String` for CSS
center | Center of map camera | `Array` in [lon, lat]
zoom | Zoom level for map camera | `Number` `0-22`
control | Object of control options, supports | `fullscreen`, `scale`
XYZ | Raster tile URL | `URL` with {x}, {y} and {z}
GPX | GPX file path | `String` for fetchable resource path

### Option: `aliases`

**`object` contains entry for each option**

For readability, Specify `aliases` with entries in key-value format for each option:

```yml
# The following config file...
center: [139.6917,35.6895]
zoom: 10

# Is equal to the following:
center: Tokyo
zoom: Metropolitan area
aliases:
  center:
    Tokyo: [139.6917,35.6895]
  zoom:
    Metropolitan area: 10
```

To distinguish an alias from a normal string, each alias starts from **Uppercase Char**. If no value is specified in `aliases`, the original value would be taken.

```yml
# This is an invalid config file
center: tokyo  # Starts from lowercase, this is not an alias nor a valid value for option "center"
GPX: My-track1 # No matched value in aliases.GPX, renderer will use "My-track1" as resource path
aliases:
  center:
    Tokyo: [139.6917,35.6895]
  GPX:
    My-track2: https://example.com/track2.gpx
    My-track3: ./my-track3.gpx
```

If you want to put more information into each alias entry, use `value` to specify its value:

```yml
# The following alias...
aliases:
  center:
    Tykyo: [139.6917,35.6895]

## Is equals to the following:
aliases:
  center:
    Tykyo:
      value: [139.6917,35.6895]
      desc: The biggest city in Japan
```

### Option: `apply`

**`URL` of other config file**

To reuse written config, use `apply` to specify resource path of another config file. Options in current config file are automatically assigned by it.

```yml
apply: https://unpkg.com/mapclay/assets/default.yml

# The following alias come from applied config file
center: Delhi
zoom: City
```

### Option: `use`

**`URL` of ES6 module, with Renderer class as default export**

This option specify which [Renderer](#renderer) is used to create a map. If it is not specified, `mapclay` will use first entry in `aliases.use`.

By default, `mapclay.render()` and `mapclay.renderByTextContent()` comes with three hidden aliases for default Renderers.

#### Default Renderers

```yml
aliases:
  use:
    Leaflet:
      value: renderers/leaflet.mjs,
      description: Leaflet is the leading open-source JavaScript library for mobile-friendly interactive maps. It has all the mapping features most developers ever need.,
    Maplibre:
      value: renderers/maplibre.mjs,
      description: MapLibre GL JS is a TypeScript library that uses WebGL to render interactive maps from vector tiles in a browser. The customization of the map comply with the MapLibre Style Spec.,
    Openlayers:
      value: renderers/openlayers.mjs,
      description: OpenLayers makes it easy to put a dynamic map in any web page. It can display map tiles, vector data and markers loaded from any source. OpenLayers has been developed to further the use of geographic information of all kinds.,
```

## Renderer

A Renderer is responsible for create map view in target element. `mapclay.render()` simply do the followings behind:
1. Create a new child element with class `map-container`
2. Get Renderer by `use` value in current config file
3. calls `Renderer.createView()` for a new map.

```js
// Pesudo code in mapclay.render(target, config)
function render(target, config) {
  const child_element = document.createElement('div')
  target.appendChild(child_element)
  target.append(child_element)

  const RendererClass = (await import(config.use)).default
  const renderer = new RendererClass(config)
  renderer.createView(child_element)
}
```

Create a new one if [default Renderers](#default-renderers) doesn't fit your need. Here is an short example about creating a new custom Renderer Class, which is based on default Renderer Class:

```js
import defaultExport from 'https://unpkg.com/mapclay/dist/renderers/maplibre.mjs'

export default class extends defaultExport {
  // Override default config in Renderer
  static defaultConfig = {
    ...super.defaultConfig,
    pitch: 60,
    bearing: 30,
    style: 'https://tile.openstreetmap.jp/styles/osm-bright/style.json',
  )

  // Override method createView
  async createView(target) {
    // Do something after map is created by parent
    const map = await super.createView(target)

    // Add a simple marker
    const marker = new maplibregl.Marker()
      .setLngLat([12.550343, 55.665957])
      .addTo(map);

    return map
  }
}
```

Then put the new Renderer into option `use`:

```yml
use: https://path/to/custom-module-with-renderer.mjs
```


## More details

### JSON as text content

Since YAML is a [ superset of JSON ](https://yaml.org/spec/1.2.2/#:~:text=superset%20of%20JSON), user can still write JSON in text content of element:

```html
<pre>
  {
    "use": "Openlayers",
    "center": "Tykyo",
    "zoom": 8
  }
</pre>
```

### Multiple config files

Since YAML docs are separated by `---`, you can render multiple maps at onece in a single target element by multiple YAML docs.

[Try it out](https://markdown-it.github.io/#md3=%7B%22source%22%3A%22%60%60%60%5Cnuse%3A%20Leaflet%5Cn---%5Cnuse%3A%20Maplibre%5Cn---%5Cnuse%3A%20Openlayers%5Cn%60%60%60%5Cn%5Cn%3Cscript%20src%3D%27https%3A%2F%2Funpkg.com%2Fmapclay%40latest%2Fdist%2Fmapclay.js%3Ftarget%3Dpre%27%3E%3C%2Fscript%3E%22%2C%22defaults%22%3A%7B%22html%22%3Atrue%2C%22xhtmlOut%22%3Afalse%2C%22breaks%22%3Afalse%2C%22langPrefix%22%3A%22%22%2C%22linkify%22%3Atrue%2C%22typographer%22%3Afalse%2C%22_highlight%22%3Afalse%2C%22_strict%22%3Afalse%2C%22_view%22%3A%22html%22%7D%7D) with online markdown editor_

```yml
# These are three valid YAML docs

use: Leaflet
---
use: Maplibre
---
use: Openlayers
```

### Run scripts after map is created

Default Renderers use `eval` options for custom scripts, it simply run `eval(VALUE_OF_OPTION)`.

```yml
# Get methods in current Renderer
use: Openlayers
eval: console.log(Object.entries(this))
```

```yml
# Get View projection from ol.Map, it returns EPSG:3857 by default
use: Openlayers
eval: console.log(map.getView().getProjection().code)
```

Though YAML supports multi-lines string by symbol `>` and `|`, but indent really bothers.

To make it simpler, **if YAML doc is parsed as string, it would be treated as value of `eval` of last YAML doc.**

So the following config...

```yml
# This YAML doc would be parsed as an JSON object
use: Leaflet
eval: |
  console('This is the first YAML doc')
  console('with multi-lines')
  console('string of script')
---
# This YAML doc would be parsed as an JSON object
use: Openlayers
eval: console('This is the second YAML doc')
```

would be equal to this (`|` symbol matters):

```yml
# This YAML doc would be parsed as an JSON object
use: Leaflet
---
# This YAML doc would be parsed as String
|
console('This is the first YAML doc')
console('with multi-lines')
console('string of script')
---
# This YAML doc would be parsed as an JSON object
use: Openlayers
eval: console('This is the second YAML doc')
```

### Strictly use a default renderer

By default, `mapclay.render()` and `mapclay.renderByTextContent()` dynamically import ES6 module by option `use`. It takes time and may caused by some problem. If you want to stick to a single Renderer, try to replace script URL with default Renderers:

```html
<!-- User can specify Renderer by use option -->
<script src='https://unpkg.com/mapclay/dist/mapclay.js'></script>

<!-- User can only use Renderer comes from the following packages -->
<script src='https://unpkg.com/mapclay/dist/renderers/leaflet.js'></script>
<script src='https://unpkg.com/mapclay/dist/renderers/maplibre.js'></script>
<script src='https://unpkg.com/mapclay/dist/renderers/openlayers.js'></script>
```

## TODOs

- Map Features
  - Supports PMTiles from [ Protomaps ](https://protomaps.com/)
  - Management of layer group

## See Also

- MapML: https://maps4html.org/web-map-doc/
- odyssey.js: http://cartodb.github.io/odyssey.js/
