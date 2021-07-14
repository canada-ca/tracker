const Accordion = {
  parts: ['container', 'button', 'panel', 'icon'],
  // Styles for the base style
  baseStyle: {
    button: {
      w: '100%',
      textAlign: 'center',
      fontWeight: '600',
    },
  },
  // Styles for the size variations
  sizes: {},
  // Styles for the visual style variations
  variants: {},
  // The default `size` or `variant` values
  defaultProps: {},
}

export default Accordion

/*
justifyContent: 'center',
fontWeight: 'semibold',
rounded: 'md',
transition: 'all 0.2s cubic-bezier(.08,.52,.52,1)',
overflow: 'hidden',
px: '4',
py: '2',
color: 'gray.50',
bg: 'primary',
_hover: {
  bg: 'primary2',
},
_active: {
  boxShadow: 'outline',
},
_focus: {
  boxShadow: 'outline',
},
_disabled: { opacity: '0.4', cursor: 'not-allowed', boxShadow: 'none' },
*/
