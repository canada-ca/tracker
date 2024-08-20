import React, { useState } from 'react'
import { TourContext } from './TourContextCore'
import PropTypes from 'prop-types'

export const TourProvider = ({ children }) => {
  const [isTourOpen, setIsTourOpen] = useState(false)
  //starts and ends tour
  const startTour = () => setIsTourOpen(true)
  const endTour = () => setIsTourOpen(false)

  return <TourContext.Provider value={{ isTourOpen, startTour, endTour }}>{children}</TourContext.Provider>
}

TourProvider.propTypes = {
  children: PropTypes.node.isRequired,
}
