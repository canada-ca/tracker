import React, { useEffect } from 'react'
import Joyride from 'react-joyride'
import { useTour } from '../hooks/useTour'
import { tourSteps, orgTourSteps } from '../config/tourSteps'

export const HomeTourComponent = () => {
  const { isTourOpen, endTour } = useTour()

  return (
    <>
      <Joyride
        steps={tourSteps}
        run={isTourOpen}
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

export const OrgTourComponent = () => {
  const { isTourOpen, endTour } = useTour()

  return (
    <>
      <Joyride
        steps={orgTourSteps}
        run={isTourOpen}
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
