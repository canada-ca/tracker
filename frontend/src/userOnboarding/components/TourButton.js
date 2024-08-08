import React from 'react'
import { useLocation } from 'react-router-dom'
import { useTour } from '../hooks/useTour'
import { Button } from '@chakra-ui/react'
import { QuestionOutlineIcon } from '@chakra-ui/icons'
import { IconButton } from '@chakra-ui/react'

const toursConfig = {
  '/': 'landingPage',
  '/organizations': 'organizationsPage',
  '/domains': 'domainPage',
  '/admin/organizations': 'adminProfilePage',
}

const TourButton = () => {
  const { pathname } = useLocation()
  const { startTour } = useTour()
  console.log(pathname)
  const handleStartTour = () => {
    console.log('Tour Button Clicked')
    const tourName = toursConfig[pathname]
    if (tourName) {
      startTour(tourName)
    } else {
      console.warn('No Tour')
    }
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
export default TourButton
