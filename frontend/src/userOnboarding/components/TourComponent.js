import React from 'react'
import Joyride from 'react-joyride'
import { tourSteps } from '../config/tourSteps'
import { useTour } from '../hooks/useTour'

const TourComponent = () => {
    const { isTourOpen, endTour } = useTour()

    return (
        <Joyride
            steps={tourSteps}
            run={isTourOpen}
            continuous={true}
            showProgress={true}
            showSkipButton={true}
            callback={({ action }) => {
                if (action === 'close' || action === 'skip') {
                    endTour()
                }
            }}
        />
    )
}
export default TourComponent