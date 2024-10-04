import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import { TourButton } from '../components/TourButton'
import * as useTourModule from '../hooks/useTour'
import { MemoryRouter } from 'react-router-dom'
import { useLocation } from 'react-router-dom'

// Mock the useTour hook
jest.mock('../hooks/useTour', () => ({
  useTour: jest.fn(),
}))

// Mock useLocation hook from react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: jest.fn(),
}))

describe('TourTextButton', () => {
  it('calls startTour with the correct tour name when clicked', () => {
    const mockStartTour = jest.fn()
    useTourModule.useTour.mockReturnValue({ startTour: mockStartTour })
    const mockUseLocation = require('react-router-dom').useLocation
    mockUseLocation.mockReturnValue({ pathname: '/organizations' })

    const { getByText } = render(
      <MemoryRouter>
        <TourButton />
      </MemoryRouter>,
    )

    //Simulate button click
    fireEvent.click(getByText('Start Tour'))

    expect(mockStartTour).toHaveBeenCalledWith('organizationsPage')
  })

  it('logs a warning when there is no tour configured for the current pathname', () => {
    // Setup mocks
    useTourModule.useTour.mockReturnValue({ startTour: jest.fn() })
    useLocation.mockReturnValue({ pathname: '/unconfigured-path' })

    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})

    // Render TourButton
    const { getByText } = render(<TourButton />)

    // Simulate button click
    fireEvent.click(getByText('Start Tour'))

    // Assert that console.warn was called with 'No Tour'
    expect(consoleWarnSpy).toHaveBeenCalledWith('No Tour')

    consoleWarnSpy.mockRestore()
  })
})
