import React, { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

function useSearchParam({ name, validOptions, defaultValue }) {
  const { search } = useLocation()
  const navigate = useNavigate()

  const searchParams = React.useMemo(() => {
    return new URLSearchParams(search)
  }, [search])

  const parseVal = (value) => {
    try {
      return JSON.parse(value)
    } catch {
      return value
    }
  }

  const value = searchParams.get(name) || defaultValue
  const searchValue = !validOptions || validOptions.includes(value) ? parseVal(value) : defaultValue

  const setSearchParams = React.useCallback(
    (value) => {
      if (Array.isArray(value)) {
        if (value == null || value.length === 0) {
          searchParams.delete(name)
        } else {
          searchParams.set(name, JSON.stringify(value))
        }
      } else {
        if (value == null || value === '' || (validOptions && !validOptions.includes(value))) {
          searchParams.delete(name)
        } else {
          searchParams.set(name, value)
        }
      }
      navigate({ search: searchParams.toString(), replace: true })
    },
    [searchParams, history, name, validOptions],
  )

  useEffect(() => {
    if ((validOptions && !validOptions.includes(value)) || value === '') {
      if (value != null) {
        setSearchParams(null)
      } else {
        setSearchParams(defaultValue)
      }
    } else if (value === null || value.length === 0) {
      setSearchParams(defaultValue)
    }
  }, [value, validOptions, defaultValue, setSearchParams, name])

  return { searchValue, setSearchParams }
}

export default useSearchParam
