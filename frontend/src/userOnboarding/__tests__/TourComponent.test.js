import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { TourComponent } from './TourComponent'
import { useTour } from '../../hooks/useTour'
import { useAuth } from '../../hooks/useAuth'
import { mainTourSteps } from '../../config/tourSteps'

// Mock the hooks
jest.mock('../../hooks/useTour')
jest.mock('../../hooks/useAuth')

// Mock the Joyride component
jest.mock('react-joyride', () => {
  return jest.fn(({ callback, steps }) => {
    return (
      <div data-testid="mock-joyride">
        <button onClick={() => callback({ status: 'finished' })}>Finish Tour</button>
        <ul>
          {steps.map((step, index) => (
            <li key={index}>{step.content}</li>
          ))}
        </ul>
      </div>
    )
  })
})

// Mock tour steps
jest.mock('../../config/tourSteps', () => ({
  mainTourSteps: {
    home: [
      { target: '.step-1', content: 'Home Step 1', requiresAuth: false },
      { target: '.step-2', content: 'Home Step 2', requiresAuth: true },
    ],
    dashboard: [
      { target: '.step-1', content: 'Dashboard Step 1', requiresAuth: true },
      { target: '.step-2', content: 'Dashboard Step 2', requiresAuth: true },
    ],
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
    useAuth.mockReturnValue({ isAuthenticated: false })

    render(<TourComponent page="home" />)
    
    expect(mockStartTour).toHaveBeenCalled()
  })

  it('does not start the tour for users who have seen it', () => {
    localStorage.setItem('hasSeenTour_home', 'true')
    const mockStartTour = jest.fn()
    useTour.mockReturnValue({ isTourOpen: false, startTour: mockStartTour, endTour: jest.fn() })
    useAuth.mockReturnValue({ isAuthenticated: false })

    render(<TourComponent page="home" />)
    
    expect(mockStartTour).not.toHaveBeenCalled()
  })

  it('renders Joyride component when tour is open', () => {
    useTour.mockReturnValue({ isTourOpen: true, startTour: jest.fn(), endTour: jest.fn() })
    useAuth.mockReturnValue({ isAuthenticated: false })

    render(<TourComponent page="home" />)
    
    expect(screen.getByTestId('mock-joyride')).toBeInTheDocument()
  })

  it('ends the tour when finished', () => {
    const mockEndTour = jest.fn()
    useTour.mockReturnValue({ isTourOpen: true, startTour: jest.fn(), endTour: mockEndTour })
    useAuth.mockReturnValue({ isAuthenticated: false })

    render(<TourComponent page="home" />)
    
    fireEvent.click(screen.getByText('Finish Tour'))
    
    expect(mockEndTour).toHaveBeenCalled()
    expect(localStorage.getItem('hasSeenTour_home')).toBe('true')
  })

  it('resets all tours when reset button is clicked', () => {
    localStorage.setItem('hasSeenTour_home', 'true')
    localStorage.setItem('hasSeenTour_dashboard', 'true')
    const mockStartTour = jest.fn()
    useTour.mockReturnValue({ isTourOpen: false, startTour: mockStartTour, endTour: jest.fn() })
    useAuth.mockReturnValue({ isAuthenticated: false })

    render(<TourComponent page="home" />)
    
    const resetButton = screen.getByText('Reset All Tours')
    fireEvent.click(resetButton)

    expect(localStorage.getItem('hasSeenTour_home')).toBeNull()
    expect(localStorage.getItem('hasSeenTour_dashboard')).toBeNull()
    expect(mockStartTour).toHaveBeenCalled()
  })

  it('shows all steps for authenticated users', () => {
    useTour.mockReturnValue({ isTourOpen: true, startTour: jest.fn(), endTour: jest.fn() })
    useAuth.mockReturnValue({ isAuthenticated: true })

    render(<TourComponent page="home" />)
    
    expect(screen.getByText('Home Step 1')).toBeInTheDocument()
    expect(screen.getByText('Home Step 2')).toBeInTheDocument()
  })

  it('shows only non-auth steps for non-authenticated users', () => {
    useTour.mockReturnValue({ isTourOpen: true, startTour: jest.fn(), endTour: jest.fn() })
    useAuth.mockReturnValue({ isAuthenticated: false })

    render(<TourComponent page="home" />)
    
    expect(screen.getByText('Home Step 1')).toBeInTheDocument()
    expect(screen.queryByText('Home Step 2')).not.toBeInTheDocument()
  })

  it('does not start tour for pages with only auth-required steps for non-authenticated users', () => {
    const mockStartTour = jest.fn()
    useTour.mockReturnValue({ isTourOpen: false, startTour: mockStartTour, endTour: jest.fn() })
    useAuth.mockReturnValue({ isAuthenticated: false })

    render(<TourComponent page="dashboard" />)
    
    expect(mockStartTour).not.toHaveBeenCalled()
    expect(screen.queryByTestId('mock-joyride')).not.toBeInTheDocument()
  })

  it('starts tour for authenticated users on pages with only auth-required steps', () => {
    const mockStartTour = jest.fn()
    useTour.mockReturnValue({ isTourOpen: true, startTour: mockStartTour, endTour: jest.fn() })
    useAuth.mockReturnValue({ isAuthenticated: true })

    render(<TourComponent page="dashboard" />)
    
    expect(mockStartTour).toHaveBeenCalled()
    expect(screen.getByTestId('mock-joyride')).toBeInTheDocument()
    expect(screen.getByText('Dashboard Step 1')).toBeInTheDocument()
    expect(screen.getByText('Dashboard Step 2')).toBeInTheDocument()
  })
})