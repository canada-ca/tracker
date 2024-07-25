import { useContext } from 'react'
import { TourContext } from '../contexts/TourContextCore'

export const useTour = () => {
  useContext(TourContext)
}

export default useTour
