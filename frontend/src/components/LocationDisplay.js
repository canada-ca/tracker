// location display stuff
import React from 'react'
import {useLocation} from 'react-router-dom'

// Displays current routing location used for testing
export const LocationDisplay = () => {
  const location = useLocation()

  return <div data-testid="location-display">{location.pathname}</div>
}


