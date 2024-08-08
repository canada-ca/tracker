import React, { useEffect, useState } from 'react'
import Joyride from 'react-joyride'
import { useTour } from '../hooks/useTour'
import { mainTourSteps } from '../config/tourSteps'
import { Trans } from '@lingui/macro'

export const TourComponent = ({ page }) => {
  const { isTourOpen, endTour } = useTour()
  const [tourKey, setTourKey] = useState(0)

  useEffect(() => {
    if (isTourOpen) {
      setTourKey((prevKey) => prevKey + 1)
    }
  }, [isTourOpen])

  return (
    <>
      <Joyride
        key={tourKey}
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
        locale={{
          back: <Trans>Back</Trans>,
          next: <Trans>Next</Trans>,
          skip: <Trans>Skip</Trans>,
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
