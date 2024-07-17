import React, { createContext, useContext, useState } from 'react'

const TourContext = createContext()

export const TourProvider = ({ children }) => {
  const [isTourOpen, setIsTourOpen] = useState(false)

  const startTour = () => setIsTourOpen(true)
  const endTour = () => setIsTourOpen(false)

  return (
    <TourContext.Provider value={{ isTourOpen, startTour, endTour }}>
      {children}
    </TourContext.Provider>
  )
}

export const useTour = () => useContext(TourContext)