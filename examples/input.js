const radioButtons = document.querySelectorAll('input[type="radio"]');
const textArea = document.querySelector('#map-text');

radioButtons.forEach((radioButton) => {
  radioButton.addEventListener('change', (event) => {
    if (event.target.checked) {
      const regex = new RegExp(`${radioButton.name}: +.*[\r\n]*`, 'gm');
      textArea.value = textArea.value.replace(regex, '').trim() + '\n'
      textArea.value += `${radioButton.name}: ${radioButton.value}`
    }
  });
});
