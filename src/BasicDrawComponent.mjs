import {
  TerraDraw,
  TerraDrawSelectMode,
  TerraDrawPointMode,
  TerraDrawLineStringMode,
  TerraDrawPolygonMode,
  TerraDrawCircleMode,
  TerraDrawRectangleMode,
  TerraDrawRenderMode,
} from "terra-draw";

// ref: https://github.com/JamesLMilner/terra-draw/blob/main/guides/4.MODES.md#selection-mode
export const BasicDrawComponent = (adapter, options = {}) => new TerraDraw({
  adapter: adapter,
  modes: [
    new TerraDrawSelectMode({
      modename: 'modify',
      flags: {
        render: {
          feature: {
            // draggable: true,
            coordinates: {
              midpoints: true,
              draggable: true,
              deletable: true,
              validation: () => true
            },
          },
        },
      },
    }),
    new TerraDrawPointMode(),
    new TerraDrawLineStringMode(),
    new TerraDrawPolygonMode(),
    new TerraDrawCircleMode(),
    new TerraDrawRectangleMode(),
    new TerraDrawRenderMode({
      modeName: "render",
      // TODO More styles by feature properties
      styles: {
        pointColor: "red",
        pointOutlineWidth: 2,
        lineStringColor: "red",
        lineStringWidth: 2,
        polygonFillColor: "#00FFFF",
        polygonFillOpacity: 0,
        polygonOutlineColor: "red",
        polygonOutlineWidth: 2,
      }
    }),
  ],
  ...options,
})

export const addSimpleSelector = (target, draw, options = {}) => {
  const selector = document.createElement('select')
  target.appendChild(selector)
  selector.name = 'Draw'
  selector.style = 'position: absolute; top: 0.5rem; right: 0.5rem; z-index: 1000;'
  selector.innerHTML = `
      <option class="bold-option" value="nothing">Draw Something</option>
      <optgroup label="Edit Features">
        <option class="bold-option" value="modify">✎ MODIFY</option>
        <option class="bold-option" value="delete">🗑 DELETE</option>
        <option class="bold-option" value="clear"> 🧹 CLEAR</option>
      </optgroup>
      <optgroup label="Draw">
        <option value="point">⢌ Points</option>
        <option value="linestring">☇ linestring</option>
        <option value="polygon">⬠ Polygon</option>
        <option value="circle">⃝  Circle</option>
        <option value="rectangle">◻ Rectangle</option>
      </optgroup>
      <optgroup label="Extra">
        <option value="features">View Features</option>
      </optgroup>
    `

  draw.start();
  draw.setMode('render');

  // Resume drawn features
  const storageId = target.id ? `terra-draw-data-${target.id}` : 'terra-draw-data'
  const featureData = localStorage.getItem(storageId);
  if (featureData) {
    try {
      const features = JSON.parse(featureData)
      features.forEach(f => f.properties = { mode: "render" });
      draw.addFeatures(features)
    } catch (err) {
      console.warn("Fail to drawn features from Local Storage.", featureData, err)
      localStorage.removeItem(storageId)
    }
  }

  const cursorHolder = target.querySelector('canvas') ?? target
  selector.onchange = () => {
    selector.children[0].textContent = '--STOP--'
    cursorHolder.style.removeProperty('cursor')
    const features = draw.getSnapshot()

    switch (selector.value) {
      case 'nothing':
        draw.setMode("render");
        selector.children[0].textContent = 'Draw Something'
        break;
      case 'modify':
        draw.setMode("select");
        break;
      case 'delete':
        draw.setMode('render');
        cursorHolder.style.cursor = "not-allowed"
        break;
      case 'clear':
        localStorage.removeItem(storageId)
        selector.value = 'nothing'
        selector.onchange()
        draw.clear()
        break;
      case 'features':
        alert(`${features.length} features\n\n${JSON.stringify(features, null, 4)}`)
        break;
      default:
        draw.setMode(selector.value);
        break;
    }
  }

  draw.on("change", () => {
  });
  draw.on("finish", (id, context) => {
    if (context.action === 'draw') {
      const feature = draw.getSnapshot().find(feature => feature.id === id)
      if (feature) {
        draw.removeFeatures([id])
        feature.properties.mode = "render"
        draw.addFeatures([feature])
      }
    }

    const idFilter = options.idFilter ?? (() => true)
    const features = draw.getSnapshot().filter(idFilter)
    localStorage.setItem(storageId, JSON.stringify(features));

    if (context.mode !== 'point' && context.action === 'draw') {
      selector.value = 'nothing'
      selector.onchange()
    }
  });
  document.onclick = (event) => {
    if (selector.value === 'delete') {
      const features = draw.getFeaturesAtPointerEvent(event, {
        pointerDistance: 40,
      });
      if (features.length > 0) {
        draw.removeFeatures([features[0].id])
        if (draw.getSnapshot().length === 0) {
          selector.value = 'nothing'
          selector.onchange()
        }
      }
    }
  }
}
