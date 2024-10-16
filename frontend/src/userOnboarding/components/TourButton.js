import React from 'react'
import { useLocation } from 'react-router-dom'
import { useTour } from '../hooks/useTour'
// import { QuestionOutlineIcon } from '@chakra-ui/icons'
// import { IconButton } from '@chakra-ui/react'
import { Button } from '@chakra-ui/react'
import { Trans } from '@lingui/macro'

export const toursConfig = {
  // list of pages with their paths
  // Start tour button will only appear on these pages
  '/': 'landingPage',
  // '/organizations': 'organizationsPage',
  '/domains': 'domainPage',
  // '/my-tracker/summary': ' myTrackerPage',
  // '/dmarc-summaries': 'dmarcSummariesPage',
  // '/admin/organizations': 'adminProfilePage',
}
//Tour button as an icon, made for the individual pages (not needed for top banner)

// export const TourIconButton = () => {
//   const { pathname } = useLocation()
//   const { startTour } = useTour()
//   const handleStartTour = () => {
//     const tourName = toursConfig[pathname]
//     if (tourName) startTour(tourName)
//   }

//   return (
//     <IconButton
//       onClick={handleStartTour}
//       variant="ghost"
//       icon={<QuestionOutlineIcon />}
//       size="lg"
//       px="3"
//       mr="2"
//       display={{ base: 'none', md: 'inline' }}
//       aria-label="Start Tour"
//     />
//   )
// }

export const TourButton = () => {
  const { pathname } = useLocation()
  const { startTour } = useTour()

  const tourName = toursConfig[pathname]

  const handleStartTour = () => {
    if (tourName) startTour(tourName)
  }

  if (!tourName) {
    return null
  }

  return (
    <Button onClick={handleStartTour} variant="primaryWhite" mx="2" display={{ base: 'none', md: 'inline' }}>
      <Trans>Start Tour</Trans>
    </Button>
  )
}
