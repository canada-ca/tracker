import { useContext } from 'react'
import { TourContext } from '../contexts/TourContext'

export const useTour = () => useContext(TourContext)