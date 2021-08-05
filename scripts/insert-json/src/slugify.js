const urlSlug = require("url-slug");

const slugify = (input) => {
  if (typeof input !== "string") {
    return undefined;
  }

  return urlSlug.convert(input, {
    separator: "-",
    transformer: urlSlug.LOWERCASE_TRANSFORMER,
  });
};

module.exports = {
  slugify,
};
