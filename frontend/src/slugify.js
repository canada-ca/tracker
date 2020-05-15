export function slugify(text) {
  return (
    text
      .toString()
      .toLowerCase()
      // The normalize() method returns the Unicode
      // Normalization Form of a given string.
      .normalize('NFD')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '-')
      .replace(/--+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '')
  )
}
