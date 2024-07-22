import React, { useState, useEffect, useReducer } from 'react'
import { TourContext } from './TourContextCore'

export const TourProvider = ({ children }) => {
  const [isTourOpen, setIsTourOpen] = useState(false)

  const startTour = () => setIsTourOpen(true)
  const endTour = () => setIsTourOpen(false)

  return <TourContext.Provider value={{ isTourOpen, startTour }}>{children}</TourContext.Provider>
}

export const useTour = () => {
  const context = useContext(TourContext)
  if (context === undefined) {
    throw new Error('useTour must be used within a TourProvider')
  }
  return context
}
