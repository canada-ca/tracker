import { useEffect, useState } from 'react'

export const useDebounce = (toCall, delay, params) => {
  const [timeoutID, setTimeoutID] = useState()

  useEffect(() => {
    console.log(params)
    if (timeoutID) {
      clearTimeout(timeoutID)
      setTimeoutID(undefined)
    }
    const newTimeoutID = setTimeout(toCall, delay, ...params)
    setTimeoutID(newTimeoutID)
  }, [delay, params, toCall])
}
