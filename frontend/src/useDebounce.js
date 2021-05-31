import { useEffect, useState } from 'react'

export const useDebounce = (toCall, delay, params) => {
  const [timeoutID, setTimeoutID] = useState()

  useEffect(() => {
    clearTimeout(timeoutID)

    const newTimeoutID = setTimeout(toCall, delay, ...params)
    setTimeoutID(newTimeoutID)
  }, [delay, params, toCall])
}
