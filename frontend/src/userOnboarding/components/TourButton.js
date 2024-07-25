import React from 'react'
import { useTour } from '../hooks/useTour'

const TourButton = () => {
  const { startTour } = useTour()

  return <button onClick={startTour}>Start Tour</button>
}
export default TourButton
