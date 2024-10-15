import { renderHook, act } from '@testing-library/react-hooks'
import { useTour } from '../hooks/useTour'
import { TourProvider } from '../contexts/TourContext'

describe('useTour', () => {
  it('should initialize with isTourOpen as false', () => {
    const { result } = renderHook(() => useTour(), { wrapper: TourProvider })

    expect(result.current.isTourOpen).toBe(false)
  })

  it('should set isTourOpen to true when startTour is called', () => {
    const { result } = renderHook(() => useTour(), { wrapper: TourProvider })

    act(() => {
      result.current.startTour()
    })

    expect(result.current.isTourOpen).toBe(true)
  })

  it('should set isTourOpen to false when endTour is called', () => {
    const { result } = renderHook(() => useTour(), { wrapper: TourProvider })

    //start the tour
    act(() => {
      result.current.startTour()
    })

    //end the tour
    act(() => {
      result.current.endTour()
    })

    expect(result.current.isTourOpen).toBe(false)
  })
})
