const commonProps = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 'semibold',
  rounded: 'md',
  transition: 'all 0.2s cubic-bezier(.08,.52,.52,1)',
  overflow: 'hidden',
  px: '4',
  py: '2',
  _active: {
    boxShadow: 'outline',
  },
  _focus: {
    boxShadow: 'outline',
  },
  _disabled: { opacity: '0.4', cursor: 'not-allowed', boxShadow: 'none' },
}

const Button = {
  // Styles for the base style
  baseStyle: {},
  // Styles for the size variations
  sizes: {},
  // Styles for the visual style variations
  variants: {
    primary: {
      ...commonProps,
      color: 'gray.50',
      bg: 'primary',
      _hover: {
        bg: 'primary2',
      },
    },
    primaryOutline: {
      ...commonProps,
      color: 'primary',
      bg: 'transparent',
      borderColor: 'primary',
      borderWidth: '1px',
    },
    primaryHover: {
      ...commonProps,
      color: 'gray.50',
      bg: 'primary',
      borderColor: 'gray.50',
      borderWidth: '1px',
      _hover: {
        color: 'accent',
        bg: 'primary',
        borderColor: 'accent',
      },
    },
    primaryWhite: {
      ...commonProps,
      color: 'primary',
      bg: 'gray.50',
      borderColor: 'gray.50',
      borderWidth: '1px',
      _hover: {
        color: 'primary',
        bg: 'accent',
        borderColor: 'accent',
      },
    },
    outline: {
      ...commonProps,
      color: 'primary2',
      bg: 'transparent',
      borderColor: 'primary2',
      borderWidth: '1px',
      _hover: {
        bg: 'blue.50',
      },
    },
    danger: {
      ...commonProps,
      color: 'gray.50',
      bg: 'red.700',
      _hover: {
        bg: 'red.600',
      },
    },
    strong: {
      ...commonProps,
      color: 'white',
      bg: 'strong',
      _hover: {
        bg: 'green.400',
      },
    },
    info: {
      ...commonProps,
      color: 'white',
      bg: 'info',
      _hover: {
        bg: 'blue.300',
      },
    },
    weak: {
      ...commonProps,
      color: 'white',
      bg: 'weak',
      _hover: {
        bg: 'red.400',
      },
    },
  },
  // The default `size` or `variant` values
  defaultProps: {},
}

export default Button
