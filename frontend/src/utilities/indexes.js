export const indexes = ({ page, recordsPerPage }) => {
  const offset = (page - 1) * recordsPerPage
  return [offset, offset + recordsPerPage]
}
