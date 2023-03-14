import 'https://cdnjs.cloudflare.com/ajax/libs/js-yaml/4.1.0/js-yaml.min.js';

const choices = document.querySelectorAll('div[class="field"]');
const textArea = document.querySelector('#map-text');

choices.forEach((choice) => {
  choice.addEventListener('click', (event) => {
    // Check radio button
    choice.querySelector('input[type="radio"]').checked = true

    // Get field for current option
    const field = choice.querySelector('input').name

    // Get value from div or text input
    var value = choice.dataset.value
    value = value ? value : choice.querySelector('input[type="text"]').value;

    // Change value by type
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
    var options = jsyaml.load(textArea.value, 'utf8');
    options = options ? options : {}

    // Set new value
    Object.assign(options, assign)
    textArea.value = jsyaml.dump(options);
  });
});

const textInputs = document.querySelectorAll('input[type="text"]');
textInputs.forEach((input) => {
  input.addEventListener('focusout', (event) => {
    input.parentElement.click()
  });
});
