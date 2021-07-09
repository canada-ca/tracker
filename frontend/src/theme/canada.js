import { theme as chakraTheme } from '@chakra-ui/react'

const shadows = {
  outline: '0 0 0 4px #FEC04F',
  medium: ' 0 0 0.4em 0.2em #D5D5D5',
  outlineHover: '0 0 0 6px #D5D5D5',
  outlineLeft: '-2px 0 0 0 #D5D5D5, 2px 0 0 0 inset #D5D5D5',
}

const colors = {
  primary: '#2e2e40',
  primary2: '#E65225',
  accent: '#FDB73F',
  strong: '#278400',
  moderate: '#FF9900',
  moderateAlt: '#e65c00',
  weak: '#D3080C',
  info: '#3f8cd9',
  strongMuted: '#E0FFE0',
  weakMuted: '#FFE0E0',
  infoMuted: '#d2e7fc',
  moderateMuted: '#FFE6C0',
  unknown: '#6C6C6C',
  green: {
    50: '#F2FFF0',
    100: '#C3EEBF',
    200: '#92D68F',
    300: '#5CB95B',
    400: '#3C9D3F',
    500: '#2D8133',
    600: '#24672B',
    700: '#1F5126',
    800: '#183C1F',
    900: '#102715',
  },
  gray: {
    50: '#FAFAFA',
    100: '#F2F2F2',
    200: '#E8E8E8',
    300: '#D5D5D5',
    400: '#AEAEAE',
    500: '#808080',
    550: '#444444',
    600: '#555555',
    700: '#373737',
    800: '#202020',
    900: '#191919',
  },
  yellow: {
    50: '#FFFDF0',
    100: '#FEF1BF',
    200: '#FADE89',
    250: '#FEC04F',
    300: '#F6C95E',
    400: '#ECB64B',
    500: '#D6962E',
    600: '#B7761F',
    700: '#975A16',
    800: '#744210',
    900: '#5F370E',
  },
  blue: {
    50: '#EBF8FF',
    100: '#CEEDFF',
    200: '#90CDF4',
    300: '#63B3ED',
    400: '#4299E1',
    500: '#3182CE',
    600: '#2A69AC',
    700: '#1E4E8C',
    800: '#153E75',
    900: '#0D467D',
  },
}

const fonts = {
  heading: '"Noto Sans", sans-serif',
  body: '"Noto Sans", sans-serif',
  mono:
    'Noto Mono,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace',
}

const fontSizes = {
  xs: '0.75rem',
  sm: '0.875rem',
  md: '1rem',
  lg: '1.125rem',
  xl: '1.25rem',
  '2xl': '1.5rem',
  '3xl': '1.875rem',
  '4xl': '2.25rem',
  '5xl': '3rem',
  '6xl': '4rem',
}

const sizes = {
  icons: {
    xs: '0.75rem',
    sm: '1rem',
    md: '1.25rem',
    lg: '1.5rem',
    xl: '2rem',
  },
  buttons: {
    sm: '1rem',
    md: '1.25rem',
    lg: '1.5rem',
  },
  boxes: {
    2: '20rem',
  },
  width: {
    4: '4rem',
    60: '60rem',
  },
}

const borders = {
  '3px': '3px solid',
}

const borderWidths = {
  0: '0',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
}

const space = {
  0: '0',
  1: '0.25rem',
  2: '0.5rem',
  2.5: '0.625rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  7: '1.75rem',
  8: '2rem',
}

// Final Theme output
const canada = {
  ...chakraTheme,
  shadows: {
    ...chakraTheme.shadows,
    ...shadows,
  },
  fontSizes,
  fonts: {
    ...chakraTheme.fonts,
    ...fonts,
  },
  colors: {
    ...chakraTheme.colors,
    ...colors,
  },
  borders: {
    ...chakraTheme.borders,
    ...borders,
  },
  borderWidths: {
    ...chakraTheme.borderWidths,
    ...borderWidths,
  },
  space: {
    ...chakraTheme.space,
    ...space,
  },
  sizes: {
    ...chakraTheme.sizes,
    ...sizes,
  },
}

export default canada
