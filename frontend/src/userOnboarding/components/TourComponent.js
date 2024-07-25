import React, { useEffect } from 'react'
import Joyride from 'react-joyride'
import { useTour } from '../hooks/useTour'
import { tourSteps, orgTourSteps } from '../config/tourSteps'

export const TourComponent = () => {
  const { isTourOpen, endTour } = useTour()

  return (
    <>
      <Joyride
        steps={tourSteps}
        run={true}
        continuous={true}
        showProgress={true}
        showSkipButton={true}
        callback={({ status }) => {
          if (['finished', 'skipped'].includes(status)) {
            endTour()
          }
        }}
      />
    </>
  )
}

export const orgTourComponent = () => {
  const { currentTour, currentSteps, endTour } = useTour()

  return (
    <>
      <Joyride
        steps={orgTourSteps}
        run={true}
        continuous={true}
        showProgress={true}
        showSkipButton={true}
        callback={({ status }) => {
          if (['finished', 'skipped'].includes(status)) {
            endTour()
          }
        }}
      />
    </>
  )
}
