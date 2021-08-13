import React, { useCallback, useState } from 'react'
import { act, fireEvent, render } from '@testing-library/react'

import { useDebouncedFunction } from '../../utilities/useDebouncedFunction'

const UseDebouncedFunctionExample = () => {
  const [count, setCount] = useState(0)
  const [debouncedCount, setDebouncedCount] = useState(0)

  const memoizedSetDebouncedCountCallback = useCallback(
    () =>
      act(() => {
        if (count > 0) setDebouncedCount((c) => c + 1)
      }),
    [count],
  )

  useDebouncedFunction(memoizedSetDebouncedCountCallback, 500)

  return (
    <div>
      <label htmlFor="count">Count</label>
      <input type="text" id="count" value={count} readOnly />

      <label htmlFor="debouncedCount">Debounced count</label>
      <input type="text" id="debouncedCount" value={debouncedCount} readOnly />
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  )
}

describe('userDebouncedFunction', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })
  describe('is given a valid function', () => {
    it('successfully debounces the function', async () => {
      const { getByText, getByLabelText } = render(
        <UseDebouncedFunctionExample />,
      )

      const count = getByLabelText(/^Count$/i)
      const debouncedCount = getByLabelText(/^Debounced count$/i)
      const incrementButton = getByText(/Increment/i)

      // default values
      expect(count).toHaveValue('0')
      expect(debouncedCount).toHaveValue('0')

      // ensure no increments on first render
      jest.advanceTimersByTime(1000)
      expect(debouncedCount).toHaveValue('0')

      fireEvent.click(incrementButton)

      // immediate increment
      expect(count).toHaveValue('1')
      expect(debouncedCount).toHaveValue('0')

      jest.advanceTimersByTime(250)

      // part-way timeout
      expect(count).toHaveValue('1')
      expect(debouncedCount).toHaveValue('0')

      jest.advanceTimersByTime(250)

      // full timeout
      expect(count).toHaveValue('1')
      expect(debouncedCount).toHaveValue('1')

      // fire multiple events, should only count as 1 for debounced value
      fireEvent.click(incrementButton)
      fireEvent.click(incrementButton)
      fireEvent.click(incrementButton)
      fireEvent.click(incrementButton)
      fireEvent.click(incrementButton)

      // immediate increment
      expect(count).toHaveValue('6')
      expect(debouncedCount).toHaveValue('1')

      jest.advanceTimersByTime(250)

      // part-way timeout
      expect(count).toHaveValue('6')
      expect(debouncedCount).toHaveValue('1')

      jest.advanceTimersByTime(250)

      // full timeout
      expect(count).toHaveValue('6')
      expect(debouncedCount).toHaveValue('2')

      // ensure no more increments
      jest.advanceTimersByTime(1000)
      expect(debouncedCount).toHaveValue('2')
    })
  })
})
