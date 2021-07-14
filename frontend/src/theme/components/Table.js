const Table = {
  parts: ['table', 'thead', 'tbody', 'tr', 'th', 'td', 'caption'],
  // Styles for the base style
  baseStyle: {},
  // Styles for the size variations
  sizes: {},
  // Styles for the visual style variations
  variants: {
    med: {
      table: { border: '1px solid #ccc', width: '100%', tableLayout: 'fixed' },
      td: { border: '1px solid #ccc', p: 1, textAlign: 'right' },
      th: {
        border: '1px solid #ccc',
        p: 1,
        textAlign: 'center',
        fontWeight: 'bold',
      },
    },
  },
  // The default `size` or `variant` values
  defaultProps: {},
}

export default Table
