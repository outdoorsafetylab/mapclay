[![npm version](https://badge.fury.io/js/mapclay.svg)](https://badge.fury.io/js/mapclay)

In short, this module allows user build web map as soon as possible by simple options.

No third-party Map Framework dominates.
This module just creates an interface to connect options and pre-defined map renderer.

## Quick Start

Create an HTML file with the following lines:

```html
<div class="map"></div>
<script type="module" src="https://unpkg.com/mapclay@latest/js/mapclay.js"></script>
```

`mapclay.js` simply renders elements with `class="map"`(by default) as web map:

<img width="250px" src="resources/example_1.png">


Here is another example:

```html
<pre class="map">
use: maplibre
width: 40vw
height: 300px
center: [142.73, 43.83]
</pre>
<div class="map"></div>
<script type="module" src="https://unpkg.com/mapclay@{VERSION}/js/mapclay.js"></script>
```

Here is the result, another map is rendered:

<img width="500px" src="resources/example_2.png">

In this case, a new element with `class="map"` is added. Its text is used to configure a map.
`<pre>` is used instead to preserve the newlines in text.

For each option:
`use: maplibre`: Here we use [maplibre][] as map renderer
`width: 40vw`: The map's width should occupy half of viewport
`hieght: 300px`: And height should be 500px.
`center: [142.73, 43.83]`: The center of map is **140.73E 43.83N** (Hokaido).

Each renderer has its own default way to render a map.
By default, [maplibre][] use [demotiles][] as its basemap.


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


## Behind the hoods

Read wiki page for more information:
- [How it works?][]
- [Integration][]


## Contribution

Since I am not a frontend guy, source code should break some conventions or
need some modern stacks. Feel free to open an issue or PR for what you see.

## See Also

### MapML
https://maps4html.org/web-map-doc/

### odyssey.js
http://cartodb.github.io/odyssey.js/

[maplibre]:     https://maplibre.org/projects/maplibre-gl-js/
[demotiles]:    https://github.com/maplibre/demotiles/
[How it works?]: https://github.com/typebrook/mapclay.js/wiki/How-it-works
[Integration]: https://github.com/typebrook/mapclay.js/wiki/Integration
