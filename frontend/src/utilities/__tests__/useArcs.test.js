import { renderHook } from '@testing-library/react-hooks'

import { useArcs } from '../../utilities/useArcs'

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
          d:
            'M2.915172261501814,-99.95749982210324A100,100,0,0,1,88.02332027547082,47.45413667618332L53.35774343315538,27.43995655465884A60,60,0,0,0,2.9151722615018025,-59.92913957905428Z',
          name: 'bad',
          percentage: 1,
        },
        {
          count: 2,
          d:
            'M85.10814801396903,52.5033631459199A100,100,0,1,1,-2.915172261501782,-99.95749982210324L-2.91517226150181,-59.92913957905428A60,60,0,1,0,50.442571171653576,32.48918302439542Z',
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
          d:
            'M6.123233995736766e-15,-100A100,100,0,0,1,86.60254037844388,49.999999999999986L51.96152422706632,29.99999999999999A60,60,0,0,0,3.67394039744206e-15,-60Z',
        },
        {
          value: 2,
          d:
            'M86.60254037844388,49.999999999999986A100,100,0,1,1,-1.8369701987210297e-14,-100L-1.1021821192326178e-14,-60A60,60,0,1,0,51.96152422706632,29.99999999999999Z',
        },
      ])
    })
  })
})
