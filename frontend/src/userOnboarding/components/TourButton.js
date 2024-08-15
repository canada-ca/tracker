import React from 'react'
import { useLocation } from 'react-router-dom'
import { useTour } from '../hooks/useTour'
import { QuestionOutlineIcon } from '@chakra-ui/icons'
import { IconButton } from '@chakra-ui/react'
import { Button } from '@chakra-ui/react'

const toursConfig = {
  '/': 'landingPage',
  '/organizations': 'organizationsPage',
  '/domains': 'domainPage',
  '/my-tracker/summary': ' myTrackerPage',
  '/dmarc-summaries': 'dmarcSummariesPage',
  '/admin/organizations': 'adminProfilePage',
}

export const TourButton = () => {
  const { pathname } = useLocation()
  const { startTour } = useTour()
  const handleStartTour = () => {
    const tourName = toursConfig[pathname]
    if (tourName) {
      startTour(tourName)
    } else {
      console.warn('No Tour')
    }
    console.log(pathname)
  }

  return (
    <IconButton
      onClick={handleStartTour}
      variant="ghost"
      icon={<QuestionOutlineIcon />}
      size="lg"
      px="3"
      mr="2"
      display={{ base: 'none', md: 'inline' }}
      aria-label="Start Tour"
    />
  )
}

export const TourTextButton = () => {
  const { pathname } = useLocation()
  const { startTour } = useTour()

  const handleStartTour = () => {
    const tourName = toursConfig[pathname]
    if (tourName) {
      startTour(tourName)
    } else {
      console.warn('No Tour')
    }
    console.log(pathname)
  }

  return (
    <Button onClick={handleStartTour} variant="primaryWhite" mx="2" display={{ base: 'none', md: 'inline' }}>
      Start Tour
    </Button>
  )
}
