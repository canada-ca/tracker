import { theme as chakraTheme } from '@chakra-ui/core'
import React from 'react'

const shadows = {
  outline: '0 0 0 4px #F6C95E',
  medium: `0.4em 0.4em 0.3em #D5D5D5`,
  outlineHover: '0 0 0 6px #D5D5D5',
  outlineLeft: '-2px 0 0 0 #D5D5D5, 2px 0 0 0 inset #D5D5D5',
}

const colors = {
  darkgray: '#444444',
  strong: '#5CB95B',
  moderate: '#ffbf47',
  weak: '#e53e3e',
  unknown: '#B0B0B0',
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
    300: '#F6C95E',
    400: '#ECB64B',
    500: '#D6962E',
    600: '#B7761F',
    700: '#975A16',
    800: '#744210',
    900: '#5F370E',
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

const borders = {
  '3px': '3px solid',
}

const borderWidths = {
  '0': '0',
  '1': '0.25rem',
  '2': '0.5rem',
  '3': '0.75rem',
  '4': '1rem',
}

const space = {
  '7': '1.75rem',
}

const customIcons = {
  person: {
    path: (
      <path
        d="M43.905 45.543c-3.821-1.66-5.217-4.242-5.643-6.469 2.752-2.215 4.943-5.756 6.148-9.573 1.239-1.579 1.96-3.226 1.96-4.62 0-.955-.347-1.646-.955-2.158-.202-8.105-5.941-14.613-13.037-14.713-.056-.001-.11-.01-.165-.01-.022 0-.043.004-.065.004-7.052.039-12.783 6.41-13.125 14.409-.884.528-1.394 1.305-1.394 2.469 0 1.641.992 3.63 2.663 5.448 1.187 3.327 3.118 6.38 5.5 8.438-.354 2.292-1.699 5.039-5.697 6.776-2.159.938-6.105 1.781-7.808 2.649 4.362 4.769 12.624 7.769 19.589 7.805l.099.003c.008-.002.017-.001.025-.001 7.014 0 15.325-3.01 19.713-7.808-1.703-.868-5.65-1.711-7.808-2.649z"
        fill="currentColor"
      />
    ),
    viewBox: '0 0 64 64',
  },
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
  icons: {
    ...chakraTheme.icons,
    ...customIcons,
  },
}

export default canada
