import 'https://cdnjs.cloudflare.com/ajax/libs/js-yaml/4.1.0/js-yaml.min.js';

const radioButtons = document.querySelectorAll('input[type="radio"]');
const textArea = document.querySelector('#map-text');

radioButtons.forEach((radioButton) => {
  radioButton.addEventListener('change', (event) => {
    if (event.target.checked) {
      const options = jsyaml.load(textArea.value, 'utf8');
      options[radioButton.name] = radioButton.value;
      textArea.value = jsyaml.dump(options);
    }
  });
});
