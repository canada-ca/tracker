module.exports = {
  catalogs: [
    {
      path: '<rootDir>/locale/{locale}/messages',
      include: ['<rootDir>'],
      exclude: ['**/node_modules/**'],
    },
  ],
  extractBabelOptions: {},
  fallbackLocales: {
    default: 'en',
  },
  format: 'po',
  locales: ['en', 'fr'],
  rootDir: './src',
  sourceLocale: 'en',
}
