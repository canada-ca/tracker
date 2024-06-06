import { useLocation } from 'react-router-dom'
import { useEffect, useRef } from 'react'

export function ScrollToAnchor() {
  const location = useLocation()
  const lastHash = useRef('')

  // listen to location change using useEffect with location as dependency
  // https://jasonwatmore.com/react-router-v6-listen-to-location-route-change-without-history-listen
  useEffect(() => {
    if (location.hash) {
      lastHash.current = location.hash.slice(1) // safe hash for further use after navigation
    }

    if (lastHash.current) {
      setTimeout(() => {
        const el = document.getElementById(lastHash.current)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
        lastHash.current = ''
      }, 100)
    }
  }, [location])

  return null
}
