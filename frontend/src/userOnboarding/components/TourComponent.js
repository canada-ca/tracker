import React, { useEffect, useState } from 'react'
import Joyride from 'react-joyride'
import { useTour } from '../hooks/useTour'
import { mainTourSteps } from '../config/tourSteps'
import { t, Trans } from '@lingui/macro'
import { useUserVar } from '../../utilities/userState'
import theme from '../../theme/canada'
import { useLocation } from 'react-router-dom'
import { toursConfig, matchPathname } from './TourButton'
import { COMPLETE_TOUR } from '../../graphql/mutations'
import { useMutation } from '@apollo/client'
import { useToast } from '@chakra-ui/react'

export const TourComponent = () => {
  const toast = useToast()
  const { isEmailValidated } = useUserVar()
  const { isTourOpen, endTour, startTour } = useTour()
  const [tourKey, _setTourKey] = useState(0)
  const { login, currentUser, isLoggedIn } = useUserVar()
  const { darkOrange } = theme.colors.tracker.logo

  const { pathname } = useLocation()
  const tourName = matchPathname(pathname, toursConfig)

  function checkCompletedTour({ completedTours }) {
    const completedTour = completedTours.find((tour) => tour.tourId === tourName)
    return !!completedTour
  }

  const [completeTour, { _loading, _error, called }] = useMutation(COMPLETE_TOUR, {
    onError: ({ message }) => {
      toast({
        title: t`An error occurred when completing the tour.`,
        description: message,
        status: 'error',
        duration: 9000,
        isClosable: true,
        position: 'top-left',
      })
    },
    onCompleted({ completeTour }) {
      if (completeTour.result.__typename === 'CompleteTourResult') {
        login({
          ...currentUser,
          completedTours: completeTour.result.user.completedTours,
        })
      } else if (completeTour.result.__typename === 'CompleteTourError') {
        toast({
          title: t`Unable to complete the tour.`,
          description: completeTour.result.description,
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
      }
    },
  })

  // handles starting the tour based on the page and user state
  useEffect(() => {
    if (!tourName || called) return

    const hasCompletedTour = checkCompletedTour({ completedTours: currentUser?.completedTours || [] })

    if (!hasCompletedTour && isEmailValidated()) startTour()
  }, [tourName, currentUser?.completedTours])

  if (!tourName || !isLoggedIn()) {
    return null
  }

  // handles the finishing and skipping/closing of tour
  const handleJoyrideCallback = async ({ status, type, action }) => {
    if (['finished', 'skipped'].includes(status) || (type === 'step:after' && action === 'close')) {
      endTour()
      await completeTour({
        variables: {
          tourId: tourName,
        },
      })
    }
  }

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
