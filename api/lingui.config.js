module.exports = {
  catalogs: [
    {
      path: 'src/locale/{locale}/messages',
      include: ['src'],
    },
  ],
  fallbackLocales: {
    default: 'en',
  },
  format: 'po',
  locales: ['en', 'fr'],
  sourceLocale: 'en',
}
