import React from 'react'
import { useTour } from '../hooks/useTour'

const TourButton = () => {
    const { startTour } = useTour()
    
    return (
        <button onClick={startTour}>Start tour</button>
    )
}
export default TourButton