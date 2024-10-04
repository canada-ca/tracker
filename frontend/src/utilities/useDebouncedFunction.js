import { useEffect } from 'react'

export const useDebouncedFunction = (functionToCall, delay) => {
  useEffect(() => {
    const timeoutID = setTimeout(function () {
      functionToCall()
    }, delay)

    return () => {
      clearTimeout(timeoutID)
    }
  }, [functionToCall, delay])
}
