import { useEffect, useMemo, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

function useSearchParam({ name, validOptions, defaultValue }) {
  const { search } = useLocation()
  const navigate = useNavigate()

  const searchParams = useMemo(() => new URLSearchParams(search), [search])

  const parseVal = useCallback((value) => {
    try {
      return JSON.parse(value)
    } catch {
      return value
    }
  }, [])

  const value = searchParams.get(name) || defaultValue
  const searchValue = useMemo(() => {
    return !validOptions || validOptions.includes(value) ? parseVal(value) : defaultValue
  }, [value, validOptions, parseVal, defaultValue])

  const setSearchParams = useCallback(
    (value) => {
      if (Array.isArray(value)) {
        if (!value || value.length === 0) {
          searchParams.delete(name)
        } else {
          searchParams.set(name, JSON.stringify(value))
        }
      } else {
        if (!value || (validOptions && !validOptions.includes(value))) {
          searchParams.delete(name)
        } else {
          searchParams.set(name, value)
        }
      }
      navigate({ search: searchParams.toString(), replace: true })
    },
    [searchParams, navigate, name, validOptions],
  )

  useEffect(() => {
    if (!validOptions || validOptions.includes(value)) {
      if (value === null || value === '') {
        setSearchParams(defaultValue)
      }
    } else {
      setSearchParams(defaultValue)
    }
  }, [value, validOptions, defaultValue, setSearchParams])

  return { searchValue, setSearchParams }
}

export default useSearchParam
