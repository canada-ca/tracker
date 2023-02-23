import { renderHook } from '@testing-library/react-hooks'

import { useArcs } from '../useArcs'

describe('useArcs', () => {
  describe('with an array of objects', () => {
    const data = [
      { name: 'bad', count: 1, percentage: 1 },
      { name: 'good', count: 2, percentage: 1 },
    ]

    it('uses the valueAccessor to get the value from the datum', () => {
      const { result } = renderHook(() =>
        useArcs({
          innerRadius: 60,
          outerRadius: 100,
          padAngle: 0.05,
          data,
          valueAccessor: (d) => d.count,
        }),
      )
      expect(result.current).toEqual([
        {
          count: 1,
          d: 'M2.915,-99.957A100,100,0,0,1,88.023,47.454L53.358,27.44A60,60,0,0,0,2.915,-59.929Z',
          name: 'bad',
          percentage: 1,
        },
        {
          count: 2,
          d: 'M85.108,52.503A100,100,0,1,1,-2.915,-99.957L-2.915,-59.929A60,60,0,1,0,50.443,32.489Z',
          name: 'good',
          percentage: 1,
        },
      ])
    })
  })

  describe('with an array of numbers', () => {
    const data = [1, 2]

    it('calculates the d property based on the inner/outer radius', () => {
      const { result } = renderHook(() =>
        useArcs({
          innerRadius: 60,
          outerRadius: 100,
          data,
        }),
      )
      expect(result.current).toEqual([
        {
          value: 1,
          d: 'M0,-100A100,100,0,0,1,86.603,50L51.962,30A60,60,0,0,0,0,-60Z',
        },
        {
          value: 2,
          d: 'M86.603,50A100,100,0,1,1,0,-100L0,-60A60,60,0,1,0,51.962,30Z',
        },
      ])
    })
  })
})
