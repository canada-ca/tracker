const FONT_SIZES = [
  '12rem',
  '14px',
  '16px',
  '19px',
  '24px',
  '27px',
  '36px',
  '48px',
  '80px',
]

const LINE_HEIGHTS = [
  15 / 12,
  20 / 14,
  20 / 16,
  25 / 19,
  30 / 24,
  30 / 27,
  40 / 36,
  50 / 48,
  80 / 80,
]
const SPACING = ['0px', '5px', '10px', '15px', '20px', '30px', '40px', '50px']

export const BREAKPOINTS = ['320px', '641px', '769px']

const colors = {
  white: '#FFF',
  black: '#000',
  blue: '#003a66',
  lightBlue: '#2b8cc4',
  purple: '#4c2c92',
  yellow: '#ffbf47',
  focusColor: '#ffbf47',
  infoCard: '#e8e8e8',
  crimson: '#dc143c',
  green: '#008000',
  darkGreen: '#00692f',
  darkGray: '#767676',
}

const theme = {
  fontSans: 'robotoregular, sans-serif',
  fontSizes: FONT_SIZES,
  lineHeights: LINE_HEIGHTS,
  space: SPACING,
  breakpoints: BREAKPOINTS,

  checkboxes: {
    size: '24px',
    labelSize: '28px',
  },

  radioButtons: {
    size: '24px',
    labelSize: '28px',
  },

  colors: colors,

  textStyles: {
    caps: {
      textTransform: 'uppercase',
      letterSpacing: '0.2em',
    },
  },

  colorStyles: {
    link: {
      color: colors.blue,
      '&:focus': {
        backgroundColor: colors.focusColor,
        outline: `3px solid ${colors.focusColor}`,
      },
      '&:visited': {
        color: colors.purple,
      },
      '&:hover': {
        color: colors.lightBlue,
      },
    },
    button: {
      cursor: 'pointer',
      color: colors.white,
      backgroundColor: colors.green,
      '&:focus': {
        outline: `3px solid ${colors.focusColor}`,
      },
      '&:hover': {
        backgroundColor: colors.darkGreen,
      },
    },
    footerLink: {
      color: '#FFF',
      '&:focus': {
        outline: `3px solid ${colors.focusColor}`,
      },
    },

    textArea: {
      color: colors.black,
      '&:focus': {
        outline: `3px solid ${colors.focusColor}`,
      },
    },
  },
}

export default theme
