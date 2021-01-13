export * from './domain'
export * from './organization-acronym'
export * from './selector'
export * from './slug'
export * from './year'

const { Acronym } = require('./organization-acronym.js')
const { Domain } = require('./domain')
const { Selectors } = require('./selector.js')
const { Slug } = require('./slug.js')
const { Year } = require('./year.js')

module.exports = {
  Acronym,
  Domain,
  Selectors,
  Slug,
  Year,
}
