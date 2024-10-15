import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import { TourButton } from '../components/TourButton'
import * as useTourModule from '../hooks/useTour'
import { MemoryRouter } from 'react-router-dom'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: {},
  },
})

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

    const { getByRole } = render(
      <MemoryRouter>
        <I18nProvider i18n={i18n}>
          <TourButton />
        </I18nProvider>
      </MemoryRouter>,
    )

    //Simulate button click
    fireEvent.click(getByRole('button', { name: /Start Tour/i }))

    expect(mockStartTour).toHaveBeenCalledWith('organizationsPage')
  })
})
