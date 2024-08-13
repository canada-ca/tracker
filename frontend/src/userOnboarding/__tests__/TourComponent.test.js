import React from 'react'
import { render } from '@testing-library/react'
import { TourComponent } from '../components/TourComponent'
import { useTour } from '../hooks/useTour'
import { mainTourSteps } from '../config/tourSteps'

jest.mock('../hooks/useTour')

jest.mock('react-joyride', () => {
  return jest.fn(({ callback }) => {
    return <div data-testid="mock-joyride" onClick={() => callback({ status: 'finished' })} />
  })
})

jest.mock('../config/tourSteps', () => ({
  mainTourSteps: {
    page1: [{ target: 'step1', content: 'content1' }],
    page2: [{ target: 'step2', content: 'content2' }],
  },
}))

describe('TourComponent', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.clearAllMocks()
  })

  it('starts the tour automatically for new users', () => {
    const mockStartTour = jest.fn()
    useTour.mockReturnValue({ isTourOpen: false, startTour: mockStartTour, endTour: jest.fn() })

    render(<TourComponent page="home" />)

    expect(mockStartTour).toHaveBeenCalled()
  })

  it('does not start the tour for users who have seen it', () => {
    localStorage.setItem('hasSeenTour_home', 'true')
    const mockStartTour = jest.fn()
    useTour.mockReturnValue({ isTourOpen: false, startTour: mockStartTour, endTour: jest.fn() })

    render(<TourComponent page="home" />)

    expect(mockStartTour).not.toHaveBeenCalled()
  })

  it('renders Joyride component when tour is open', () => {
    useTour.mockReturnValue({ isTourOpen: true, startTour: jest.fn(), endTour: jest.fn() })

    render(<TourComponent page="home" />)

    expect(screen.getByTestId('mock-joyride')).toBeInTheDocument()
  })

  it('ends the tour when finished', () => {
    const mockEndTour = jest.fn()
    useTour.mockReturnValue({ isTourOpen: true, startTour: jest.fn(), endTour: mockEndTour })

    render(<TourComponent page="home" />)

    fireEvent.click(screen.getByTestId('mock-joyride'))

    expect(mockEndTour).toHaveBeenCalled()
    expect(localStorage.getItem('hasSeenTour_home')).toBe('true')
  })

  it('resets all tours when reset button is clicked', () => {
    localStorage.setItem('hasSeenTour_home', 'true')
    localStorage.setItem('hasSeenTour_about', 'true')
    const mockStartTour = jest.fn()
    useTour.mockReturnValue({ isTourOpen: false, startTour: mockStartTour, endTour: jest.fn() })

    render(<TourComponent page="home" />)

    const resetButton = screen.getByText('Reset All Tours')
    fireEvent.click(resetButton)

    expect(localStorage.getItem('hasSeenTour_home')).toBeNull()
    expect(localStorage.getItem('hasSeenTour_about')).toBeNull()
    expect(mockStartTour).toHaveBeenCalled()
  })

  it('does not render Joyride for pages without tour steps', () => {
    useTour.mockReturnValue({ isTourOpen: true, startTour: jest.fn(), endTour: jest.fn() })

    render(<TourComponent page="contact" />)

    expect(screen.queryByTestId('mock-joyride')).not.toBeInTheDocument()
  })
})
