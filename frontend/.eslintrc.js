module.exports = {
  extends: ['standard', 'prettier', 'plugin:react/recommended'],
  plugins: ['jest'],
  env: {
    'jest/globals': true,
  },
  rules: {
    'comma-dangle': ['error', 'always-multiline'],
    'no-unused-vars': [
      'error',
      {
        vars: 'all',
        args: 'all',
        varsIgnorePattern: '_',
        argsIgnorePattern: '_',
      },
    ],
  },
}
