[![npm version](https://badge.fury.io/js/mapclay.svg)](https://badge.fury.io/js/mapclay)

## Quick Start

### The minimal use case:

Specify **CSS selector** for target HTML element by **data attribute** `data-target` (`pre` in this case):

```html
<pre></pre>
<script data-target="pre" src='http://unpkg.com/mapclay@latest/dist/mapclay.js'></script>
```

<br>
Or by **query paremeter** `target`:

```html
<pre></pre>
<script src='http://unpkg.com/mapclay@latest/dist/mapclay.js?target=pre'></script>
```

<br>
The text content of target element would be parsed as [YAML], So user can specify [options] to configure map.

```html
<pre>
use: Maplibre
width: 400px
height: 50vh
center: [139.6917,35.6895]
zoom: 8
</pre>
<script src='http://unpkg.com/mapclay@latest/dist/mapclay.js?target=pre'></script>
```

_Check [the result][test1] with online markdown editor_


<br>
Of course it can render multiple targets:

```html
<pre>
use: Leaflet
</pre>
<pre>
use: Maplibre
</pre>
<pre>
use: Openlayers
</pre>
<script src='http://unpkg.com/mapclay@latest/dist/mapclay.js?target=pre'></script>
```

_Check [the result][test2] with online markdown editor_

<br>

### API calls

If **target** is not given by `<script>` tag, then use API instead:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Play with mapclay</title>
    <meta charset='utf-8'>
    <script src='http://unpkg.com/mapclay@latest/dist/mapclay.js'></script>
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

Still, get target element and write `textContent` for options:

```html
<!-- In html -->
<pre id="map">
width: 400px
height: 400px
center: [139.6917,35.6895]
zoom: 8
</pre>
```

Use `mapclay.renderByTextContent` for this case

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
  center: [139.6917,35.6895]
  zoom: 8
})
```

<br>

## Options

### Common Options

Except of `use`, `aliases` and `apply`, no options are strictly defined. Valid optoins are depends on [Renderer](#renderer) (which is specified by `use`).

But there are some general optoins come with default renderers:

option|description|value
---|---|---|
id | id of map HTML element | string
width |  CSS width of map HTML element | css string
height | CSS height of map HTML element | css string
center | Center of map camera | array `[lon, lat]`
zoom | Zoom level for map camera | number `0-22`
control | Object of control options, supports | `fullscreen`, `scale`
XYZ | Raster tile URL | URL with {x}, {y} and {z}
GPX | GPX file path | string, A fetchable resource path

### Option: `aliases`

**`object` contains entry for each option**

For readability, Specify `aliases` with key-value of aliases for each option:

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

To distinguish an alias from a normal string, each alias starts from capitalize char. And if no value is specified in `aliases`, the original value would be applied.

```yml
center: tokyo  # Starts from lowercase, this is not an alias and also no a valid value for option "center"
GPX: My-track1 # No matched value in aliases, renderer will use "My-track1" as resource path
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

To reuse options written, you can specify resource path of another config file, and automatically assign options with it.

```yml
apply: https://unpkg.com/mapclay/dist/default.yml
# The following alias come from applied config file
center: Delhi
zoom: City
```

### Option: `use`

**`URL` of ES6 module, with Renderer class as default export**

This option specify which [Renderer](#renderer) is used to create map. If it is not specified, `mapclay` will use first entry in `aliases.use`.

By default, `mapclay.render()` and `mapclay.renderByTextContent()` comes with three hidden aliases for `use`:

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




## More details

### JSON as text content

Seems YAML is a superset of JSON, user can still write JSON in textContent of HTML Element:

```html
<pre>
  {
    "use": "Openlayers",
    "center": "Tykyo",
    "zoom": 8
  }
</pre>
```

### Specify renderer

By default, `mapclay.render()` and `mapclay.renderByTextContent()` dynamically import ES6 module by `use` value in config file. If you only want to work with a single Renderer, try to replace script URL:

```html
<!-- User can specify Renderer by use option -->
<script src='http://unpkg.com/mapclay/dist/mapclay.js'></script>

<!-- User can only use Renderer comes from the following packages -->
<script src='http://unpkg.com/mapclay/dist/renderers/leaflet.js'></script>
<script src='http://unpkg.com/mapclay/dist/renderers/maplibre.js'></script>
<script src='http://unpkg.com/mapclay/dist/renderers/openlayers.js'></script>
```

## See Also

- MapML: https://maps4html.org/web-map-doc/
- odyssey.js: http://cartodb.github.io/odyssey.js/

[test1]: https://markdown-it.github.io/#md3=%7B%22source%22%3A%22%60%60%60map%5Cncenter%3A%20%5B121%2C%2024%5D%5Cnwidth%3A%20100%25%5CnXYZ%3A%20https%3A%2F%2Ftile.openstreetmap.jp%2Fstyles%2Fosm-bright%2F512%2F%7Bz%7D%2F%7Bx%7D%2F%7By%7D.png%5Cn%60%60%60%5Cn%5Cn%3Cscript%20src%3D%27http%3A%2F%2Flocalhost%3A8080%2Fdist%2Frenderers%2Fopenlayers.js%3Ftarget%3Dpre%27%3E%3C%2Fscript%3E%22%2C%22defaults%22%3A%7B%22html%22%3Atrue%2C%22xhtmlOut%22%3Afalse%2C%22breaks%22%3Afalse%2C%22langPrefix%22%3A%22%22%2C%22linkify%22%3Atrue%2C%22typographer%22%3Afalse%2C%22_highlight%22%3Afalse%2C%22_strict%22%3Afalse%2C%22_view%22%3A%22html%22%7D%7D
[options]: #options
[YAML]: https://nodeca.github.io/js-yaml/
