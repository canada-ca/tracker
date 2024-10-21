import React, { useEffect, useState } from 'react'
import Joyride from 'react-joyride'
import { useTour } from '../hooks/useTour'
import { mainTourSteps } from '../config/tourSteps'
import { Trans } from '@lingui/macro'
import { useUserVar } from '../../utilities/userState'
import theme from '../../theme/canada'
import { useLocation } from 'react-router-dom'
import { toursConfig } from './TourButton'

export const TourComponent = () => {
  const { isEmailValidated } = useUserVar()
  const { isTourOpen, endTour, startTour } = useTour()
  const [tourKey, setTourKey] = useState(0)
  const { darkOrange } = theme.colors.tracker.logo

  const { pathname } = useLocation()

  const tourName = toursConfig[pathname]

  // handles starting the tour based on the page and user state
  useEffect(() => {
    if (!tourName) return

    const hasSeenTour = localStorage.getItem(`hasSeenTour_${tourName}`)
    if (
      !hasSeenTour &&
      (!mainTourSteps[tourName]['requiresAuth'] || (mainTourSteps[tourName]['requiresAuth'] && isEmailValidated()))
    )
      startTour()
  }, [tourName, startTour])

  useEffect(() => {
    if (isTourOpen) setTourKey((prev) => prev + 1)
  }, [isTourOpen])

  if (!tourName) {
    return null
  }

  // handles the finishing and skipping/closing of tour
  const handleJoyrideCallback = ({ status, type, action }) => {
    if (['finished', 'skipped'].includes(status)) {
      localStorage.setItem(`hasSeenTour_${tourName}`, true)
      endTour()
    }

    if (type === 'step:after' && action === 'close') {
      localStorage.setItem(`hasSeenTour_${tourName}`, true)
      endTour()
    }
  }

  //Joyride component (can modify ui stuff here)
  return (
    <Joyride
      key={tourKey}
      steps={mainTourSteps[tourName]['steps']}
      run={isTourOpen}
      continuous={true}
      showProgress={false}
      showSkipButton={true}
      disableCloseOnEsc={false}
      disableOverlayClose={false}
      styles={{
        buttonNext: {
          backgroundColor: darkOrange,
        },
        buttonBack: {
          color: darkOrange,
        },
      }}
      locale={{
        back: <Trans>Back</Trans>,
        next: <Trans>Next</Trans>,
        skip: <Trans>Skip</Trans>,
        last: <Trans>Finish</Trans>,
      }}
      callback={handleJoyrideCallback}
    />
  )
}
