import {
  TerraDraw,
  TerraDrawSelectMode,
  TerraDrawPointMode,
  TerraDrawLineStringMode,
  TerraDrawPolygonMode,
  TerraDrawCircleMode,
  TerraDrawRectangleMode,
} from "terra-draw";

// ref: https://github.com/JamesLMilner/terra-draw/blob/main/guides/4.MODES.md#selection-mode
export const BasicDrawComponent = (adapter) => new TerraDraw({
  adapter: adapter,
  modes: [
    new TerraDrawSelectMode({
      modename: 'modify',
      flags: {
        point: {
          feature: {
            coordinates: {
              midpoints: true,
              draggable: true,
              deletable: true,
              validation: () => true
            },
          },
        },
        linestring: {
          feature: {
            coordinates: {
              midpoints: true,
              draggable: true,
              deletable: true,
              validation: () => true
            },
          },
        },
        polygon: {
          feature: {
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
    new TerraDrawPointMode({
      styles: {
        pointColor: "red",
      },
    }),
    new TerraDrawLineStringMode({
      styles: {
        // Fill colour (a string containing a 6 digit Hex color)
        fillColor: "#00FFFF",

        // Fill opacity (0 - 1)
        fillOpacity: 0.7,

        // Outline colour (Hex color)
        outlineColor: "#00FF00",

        //Outline width (Integer)
        outlineWidth: 2,
      },
    }),
    // TODO More than triangle
    new TerraDrawPolygonMode(),
    new TerraDrawCircleMode(),
    new TerraDrawRectangleMode(),
  ]
})

export const addSimpleSelector = (target, draw) => {
  const selector = document.createElement('select')
  target.appendChild(selector)
  selector.name = 'Draw'
  selector.style = 'position: absolute; top: 0.5rem; right: 0.5rem; z-index: 500;'
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

  // FIXME Debug only
  window.draw = draw

  draw.start();
  draw.setMode('static');

  // Resume drawn features
  const retrievedFeatures = localStorage.getItem('terra-draw-data');
  if (retrievedFeatures) {
    try {
      draw.addFeatures(JSON.parse(retrievedFeatures))
    } catch (err) {
      console.error("Fail to drawn features from local storage.", err)
    }
  }

  const cursorHolder = target.querySelector('canvas') ?? target
  selector.onchange = () => {
    selector.children[0].textContent = '--STOP--'
    cursorHolder.style.removeProperty('cursor')
    const features = draw.getSnapshot()

    switch (selector.value) {
      case 'nothing':
        draw.setMode("static");
        selector.children[0].textContent = 'Draw Something'
        break;
      case 'modify':
        draw.setMode("select");
        break;
      case 'delete':
        draw.setMode('static');
        cursorHolder.style.cursor = "not-allowed"
        break;
      case 'clear':
        localStorage.removeItem('terra-draw-data')
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

  draw.on("select", () => {
  });
  draw.on("change", () => {
    localStorage.setItem('terra-draw-data', JSON.stringify(draw.getSnapshot()));
  });
  draw.on("finish", (_, context) => {
    if (context.mode != 'point' && context.action == 'draw') {
      selector.value = 'nothing'
      selector.onchange()
    }
  });
  target.children[0].onclick = (event) => {
    if (selector.value == 'delete') {
      const features = draw.getFeaturesAtPointerEvent(event, {
        pointerDistance: 40,
      });
      if (features.length > 0) {
        draw.removeFeatures([features[0].id])
        if (draw.getSnapshot.length == 0) {
          selector.value = 'nothing'
          selector.onchange()
        }
      }
    }
  }
}
