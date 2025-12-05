import eslintPluginAstro from 'eslint-plugin-astro';
import jsxA11y from 'eslint-plugin-jsx-a11y';

export default [
  // js.configs.recommended,
  ...eslintPluginAstro.configs.recommended,
  ...eslintPluginAstro.configs['jsx-a11y-strict'], // strict rules for jsx-a11y
  {
    plugins: {
        'jsx-a11y': jsxA11y,
        'astro': eslintPluginAstro,
        },
    rules: {
        //
    }
  }
];