import React, { useEffect } from 'react'
import Joyride from 'react-joyride'
import { useTour } from '../hooks/useTour'
import { mainTourSteps } from '../config/tourSteps'

export const TourComponent = ({ page }) => {
  const { isTourOpen, endTour } = useTour()

  return (
    <>
      <Joyride
        steps={mainTourSteps[page]}
        run={isTourOpen}
        continuous={true}
        showProgress={true}
        showSkipButton={true}
        styles={{
          buttonNext: {
            backgroundColor: '#ff6600',
          },
          buttonBack: {
            color: '#ff6600',
          },
        }}
        callback={({ status }) => {
          if (['finished', 'skipped'].includes(status)) {
            endTour()
          }
        }}
      />
    </>
  )
}
