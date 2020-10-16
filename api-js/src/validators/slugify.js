const urlSlug = require('url-slug')

const slugify = (input) => {
  if (typeof input !== 'string') {
    return undefined
  }

  return urlSlug(input)
}

module.exports = {
  slugify,
}
