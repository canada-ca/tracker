import { upperCase } from 'lodash'

export const toConstantCase = (str) => {
  return upperCase(str).replace(/ /g, '_')
}
