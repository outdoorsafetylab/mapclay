## Quick Start

Create an HTML file with the following contents:

```html
<div class="map"></div>
<script type="module" src="https://unpkg.com/mapclay@0.1.3/js/mapclay.js"></script>
```

By default, `mapclay.js` will render elements with `class="map"` as web map:
![](resources/example_1.png)

By default, the center of map would be Taiwan (**121E 23N**), my hometown.

Here is another example:

```html
<div class="map"></div>
<pre class="map">
viewer: maplibre
width: 50vw
height: 500px
center: [142.73, 43.83]
</pre>
<script type="module" src="https://unpkg.com/mapclay@0.1.3/js/mapclay.js"></script>
```

Here is the result, another map is rendered:
![](resources/example_2.png)

In this case, a new element with `class="map"` is added. Its text is used to configure a map.
`<pre>` is used instead to preserve the newlines in text.

we take [maplibre][] as map viewer. The map's width should occupy half of viewport.
And height should be 500px. The center of map is **140.73E 43.83N**.

Each viewer has its own default value.
By default, [maplibre][] use [demotiles][] as its basemap


## Why This?

Modern web maps are developed by many JavaScript libraries.
Many of them are good, have fancy GIS supports and clear documentaion.
But to make a web map with them, adequate frontend knowledge are necessary.

As a hiker and a part-time volunteer of rescue, I have many friends who need to 
create digital maps for a variety of activities. Since most of them are not 
developer, their solutions are *QGIS*, *Garmin BaseCamp* or *Google My-Map/Earth*.
These solutions have better UI, but none of them can fulfill the followings 
at the same time:

1. Easily integrated into a web page
1. Open source solution and no 3rd party service needed
1. Quickly create/modify contents
1. Require minimal GIS/Coding knowledge

In short, **mapclay** is the abstraction for those use cases.

## How it works?

`mapclay.js` only do several things:

1. Use CSS selector (`.map` by default) to get elements about map rendering
1. Parse inner text of each elements from YAML format into object. 
1. If object has no property called `viewer`, assign it by default value.
1. For each `viewer` used, coresponding **Descriptor** JS class uses 
   `renderMap()` method to render elements into map.

By default, `mapclay.js` comes with three valid **Descriptor** JS classes: 
`openlayers`, `maplibre` and `leaflet`. Of course each of them use map library 
in the same name.


## Contribution

Since I am not a frontend guy, source code should break some conventions or
need some modern stacks. Feel free to open an issue or PR for what you see.

## See Also

### MapML
https://maps4html.org/web-map-doc/

### odyssey.js
http://cartodb.github.io/odyssey.js/

[maplibre]: https://maplibre.org/projects/maplibre-gl-js/
[demotiles]: https://github.com/maplibre/demotiles/
