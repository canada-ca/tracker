import { useContext } from 'react'
import { TourContext } from '../contexts/TourContextCore'

export const useTour = () => {
  const context = useContext(TourContext)
  if (typeof context === undefined) {
    throw new Error('useTour must be used within a TourProvider')
  }
  return context
}
