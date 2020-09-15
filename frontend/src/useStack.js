import { stackOffsetNone, stackOffsetExpand, stack } from 'd3-shape'
import { max } from 'd3-array'

export function useStack({ data, keys, offset: o = 'none' }) {
  let offset
  if (o === 'expand') {
    offset = stackOffsetExpand
  } else {
    offset = stackOffsetNone
  }
  const series = stack().offset(offset).keys(keys)(data)

  const maxValue = max(series.map((s) => max(s, (d) => d[1])))

  return { series, max: maxValue }
}
