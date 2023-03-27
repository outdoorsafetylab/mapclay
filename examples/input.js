import 'https://cdnjs.cloudflare.com/ajax/libs/js-yaml/4.1.0/js-yaml.min.js';

const map = document.querySelector('#map');
const textArea = document.querySelector('#map-text');
const fieldsets = document.querySelectorAll('fieldset');

//const sharedElement = document.getElementById('shared-element');
map.addEventListener('map-loaded', () => {
  refresh(false);
});

// When focus out textArea, refresh Map and set radio buttons
textArea.addEventListener('focusout', (event) => {
  refresh(autoRefresh());
});

const choices = document.querySelectorAll('div[class="field"]');
choices.forEach((choice) => {
  choice.addEventListener('click', (event) => {
    // Check radio button
    choice.querySelector('input[type="radio"]').checked = true;

    // Focus text input if possible
    const textInput = choice.querySelector('input[type="text"]');
    if (textInput && textInput.focus){ 
      textInput.focus();
    }

    // Get field for current option
    const field = choice.querySelector('input').name

    // Get value from div or text input
    var value = choice.dataset.value
    if (! value) {
      value = textInput ? textInput.value : ""
    }

    // Change value by type;
    switch (choice.dataset.type) {
      case "boolean":
        value = value === 'true';
        break;
      case "array":
        value = JSON.parse(value);
        break;
      case "number":
        value = Number.parseFloat(value);
        break;
    }

    // Get assignment of new value 
    // Considering nested attribute, use object here
    var assign = {};
    field.split('.').reverse().forEach((key, index) => {
      assign = { [key]: index == 0 ? value : assign }
    })

    // Get current options from textArea
    var options = getOptions();
 
    // Set new value
    Object.assign(options, assign)
    removeEmptyStrings(options)

    const newText = jsyaml.dump(options);
    textArea.value = newText.startsWith('{}') ? '' : newText
    refresh(autoRefresh());
  });
});

const textInputs = document.querySelectorAll('input[type="text"]');
textInputs.forEach((input) => {
  input.addEventListener('focusout', (event) => {
    input.parentElement.click()
  });
});

function removeEmptyStrings(obj) {
  for (let key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      removeEmptyStrings(obj[key]);
      if (Object.keys(obj[key]).length === 0) {
        delete obj[key]
      }
    } else if (obj[key] === '') {
      delete obj[key];
    }
  }
}

// Check if auto refresh is checked
function autoRefresh() {
  const checkbox = document.querySelector('.auto-refresh')
  return checkbox ? checkbox.checked : false
}

// Refresh Map
async function refresh(alsoRefreshMap) {
  // Refresh Map if needed
  alsoRefreshMap && await refreshMap();

  const options = getOptions();
  const optionsDic = getAllKeysAndValues(options)

  fieldsets.forEach((fieldset) => {
    const legend = fieldset.querySelector('legend').textContent

    // Hide fieldsets which are not supported by current renderer
    if (renderer.supportOptions.includes(legend)) {
      fieldset.style.display = "block";
    } else {
      fieldset.style.display = "none";
    }

    // Set field by content of textarea
    const value = optionsDic[legend]
    if (value) {
      var field = fieldset.querySelector(`div.field[data-value="${value}"]`)
      field = field ? field : fieldset.querySelector(`div.field[data-value=""]`)
      field.querySelector('input[type="radio"]').checked = true;
    }
  })
}

function getOptions() {
  var options = jsyaml.load(textArea.value, 'utf8');
  return options ? options : {}
}

function getAllKeysAndValues(obj) {
  let result = {};
  for (let key in obj) {
    if (typeof obj[key] === 'object') {
      const nestedResult = getAllKeysAndValues(obj[key]);
      for (let nestedKey in nestedResult) {
        result[`${key}.${nestedKey}`] = nestedResult[nestedKey];
      }
    } else {
      result[key] = obj[key];
    }
  }
  return result;
}
