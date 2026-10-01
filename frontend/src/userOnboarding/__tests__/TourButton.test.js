import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import { TourButton } from '../components/TourButton'
import * as useTourModule from '../hooks/useTour'
import { MemoryRouter } from 'react-router'
import { I18nProvider } from '@lingui/react'
import { i18n } from '@lingui/core'

// Mock the useTour hook
jest.mock('../hooks/useTour', () => ({
  useTour: jest.fn(),
}))

// Mock useLocation hook from react-router
jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useLocation: jest.fn(),
}))

describe('TourTextButton', () => {
  it('calls startTour with the correct tour name when clicked', () => {
    const mockStartTour = jest.fn()
    useTourModule.useTour.mockReturnValue({ startTour: mockStartTour })
    const mockUseLocation = require('react-router').useLocation
    mockUseLocation.mockReturnValue({ pathname: '/' })

    const { getByRole } = render(
      <MemoryRouter>
        <I18nProvider i18n={i18n}>
          <TourButton />
        </I18nProvider>
      </MemoryRouter>,
    )

    //Simulate button click
    fireEvent.click(getByRole('button', { name: /Start Tour/i }))

    expect(mockStartTour).toHaveBeenCalledWith('landingPage')
  })
})
