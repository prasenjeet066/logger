/** @type {import('next-i18next').UserConfig} */
const nextI18NextConfig = {
  i18n: {
    defaultLocale: 'bn',
    locales: ['en', 'bn']
  },
  reloadOnPrerender: process.env.NODE_ENV === 'development'
}

module.exports = nextI18NextConfig