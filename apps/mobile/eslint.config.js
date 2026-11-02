const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');

module.exports = defineConfig([
    expoConfig,
    prettierConfig,
    {
        settings: { react: { version: '19.3.0' } },
    },
    {
        ignores: ['dist/*', '.expo/*', 'ios/*', 'android/*'],
    },
]);
