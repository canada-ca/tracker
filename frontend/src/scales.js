import { scaleBand, scaleLinear, scaleOrdinal } from 'd3-scale'

// TODO: memoize!

export function useLinearScale({ domain, range }) {
  return scaleLinear().domain(domain).range(range)
}

export function useBandScale({ domain, range }) {
  return scaleBand().domain(domain).range(range)
}

export function useOrdinalScale({ domain, range }) {
  return scaleOrdinal().domain(domain).range(range)
}
