const js = require('@eslint/js');
const globals = require('globals');

// Browser scripts share top-level names across files (no bundler), so list them as globals.
const shared = { Engine: 'readonly', FX: 'readonly', Extras: 'readonly', EVENTS_DATA: 'readonly', THREE: 'readonly' };

module.exports = [
  { ignores: ['node_modules/**', 'vendor/**'] },
  js.configs.recommended,
  {
    files: ['*.js'],
    ignores: ['eslint.config.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'script', globals: { ...globals.browser, ...globals.commonjs, ...shared } },
    rules: {
      'no-unused-vars': ['warn', { vars: 'local', args: 'after-used', caughtErrors: 'none' }],
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-redeclare': ['error', { builtinGlobals: false }],
      eqeqeq: ['warn', 'smart'],
      'no-var': 'error',
      'prefer-const': 'warn',
    },
  },
  {
    files: ['eslint.config.js', 'tests/**/*.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'commonjs', globals: { ...globals.node, ...globals.browser } },
    rules: { 'no-unused-vars': ['warn', { args: 'after-used' }], 'no-empty': ['error', { allowEmptyCatch: true }] },
  },
];
