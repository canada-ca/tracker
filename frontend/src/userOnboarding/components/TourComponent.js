import React, { useEffect, useState } from 'react'
import Joyride from 'react-joyride'
import { useTour } from '../hooks/useTour'
import { mainTourSteps } from '../config/tourSteps'
import { Trans } from '@lingui/macro'

export const TourComponent = ({ page }) => {
  const { isTourOpen, endTour, startTour } = useTour()
  const [tourKey, setTourKey] = useState(0)

  useEffect(() => {
    const hasSeenTour = localStorage.getItem(`hasSeenTour_${page}`)

    if (!hasSeenTour) {
      startTour()
    }
  }, [page, startTour])

  useEffect(() => {
    if (isTourOpen) {
      setTourKey((prev) => prev + 1)
    }
  }, [isTourOpen])

  const handleJoyrideCallback = ({ status }) => {
    if (['finished', 'skipped'].includes(status)) {
      localStorage.setItem(`hasSeenTour_${page}`, true)
      endTour()
    }
  }

  const resetAllTours = () => {
    // Clear all hasSeenTour items from localStorage
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('hasSeenTour_')) {
        localStorage.removeItem(key)
      }
    })
    // Optionally, restart the current page's tour
    startTour()
  }

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
        callback={handleJoyrideCallback}
      />
      <button onClick={resetAllTours}>Reset Tour</button>
    </>
  )
}
