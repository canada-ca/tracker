module.exports = {
  compileNamespace: 'cjs',
  extractBabelOptions: {},
  fallbackLocale: 'en',
  sourceLocale: 'en',
  localeDir: 'src/locale',
  srcPathDirs: [
    'index.js',
    "src",
  ],
  srcPathIgnorePatterns: ['/node_modules/'],
  format: 'po',
}
