import React from 'react'
import { useTour } from '../hooks/useTour'
import { Button } from '@chakra-ui/react'

const TourButton = () => {
  const { startTour } = useTour()

  return (
    <Button onClick={startTour} variant="primaryWhite" px="3" mr="2" display={{ base: 'none', md: 'inline' }}>
      Start Tour
    </Button>
  )
}
export default TourButton
