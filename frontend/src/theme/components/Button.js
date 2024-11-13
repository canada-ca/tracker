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
      bg: 'btnMain',
      _hover: {
        bg: 'btnHover',
      },
      _active: {
        bg: 'btnActive',
      },
      _disabled: {
        bg: 'btnDisabled',
      },
    },
    primaryOutline: {
      ...commonProps,
      color: 'primary',
      bg: 'transparent',
      borderColor: 'primary',
      borderWidth: '1px',
      _hover: {
        color: 'primary',
        bg: 'gray.200',
      },
    },
    primaryWhite: {
      ...commonProps,
      color: 'primary',
      bg: 'transparent',
      borderWidth: '1px',
      borderColor: 'gray.300',
      _hover: {
        color: 'primary',
        bg: 'gray.200',
      },
    },
    catchy: {
      ...commonProps,
      color: 'gray.50',
      bg: 'tracker.logo.darkOrange',
      _hover: {
        bg: 'tracker.logo.orange',
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
    locale: {
      ...commonProps,
      // _focus: {
      //   outline: `3px solid accent`,
      // },
      _hover: {
        bg: 'gray.200',
      },
    },
  },
  // The default `size` or `variant` values
  defaultProps: {},
}

export default Button
