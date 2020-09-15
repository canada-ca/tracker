import { range } from 'd3-array'

export function useRange({ start, end, step }) {
  return range(start, end, step)
}
