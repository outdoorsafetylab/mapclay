import globals from "globals";
import pluginJs from "@eslint/js";


export default [
  {
    languageOptions: {
      globals: globals.browser
    },
    rules: {
      'no-undef': 'off',
    },
  },
  pluginJs.configs.recommended,
];
