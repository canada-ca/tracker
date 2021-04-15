import { useEffect, useState } from 'react'

export const useDebounce = (toCall, delay, param) => {
  const [timeoutID, setTimeoutID] = useState()

  useEffect(() => {
    if (timeoutID) {
      clearTimeout(timeoutID)
      setTimeoutID(undefined)
    }
    const newTimeoutID = setTimeout(toCall, delay, param)
    setTimeoutID(newTimeoutID)
  }, [delay, param, toCall])
}
