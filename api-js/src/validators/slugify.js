const urlSlug = require('url-slug')

const slugify = (input) => {
  return urlSlug(input)
}

module.exports = {
  slugify,
}