import { useEffect } from 'react'

export const useDebouncedFunction = (functionToCall, delay) => {
  useEffect(() => {
    const timeoutID = setTimeout(functionToCall, delay)

    return () => {
      clearTimeout(timeoutID)
    }
  }, [functionToCall, delay])
}
