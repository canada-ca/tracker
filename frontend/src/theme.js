import { deepMerge } from 'grommet/utils'
import { grommet } from 'grommet/themes'

export const theme = deepMerge(grommet, {
  global: {
    breakpoints: {
      xsmall: {
        value: 500,
      },
      small: {
        value: 900,
      },
      medium: {
        value: 1200,
      },
      large: {
        value: 2000,
      },
      xlarge: {
        value: 3000,
      },
    },
  },
})


