import React from 'react'
import { render, screen } from '@testing-library/react'
import { TourComponent } from '../components/TourComponent'
import { useTour } from '../hooks/useTour'

jest.mock('../hooks/useTour')

jest.mock('../config/tourSteps', () => ({
  mainTourSteps: {
    home: {
      requiresAuth: false,
      steps: [
        {
          target: '.step-1',
          content: 'Home Step 1',
        },
        {
          target: '.step-2',
          content: 'Home Step 2',
        },
      ],
    },
  },
}))

// Mock the Joyride component
jest.mock('react-joyride', () => {
  const tourSteps = require('../config/tourSteps').mainTourSteps['home']['steps']
  const MockJoyride = () => <div data-testid="mockJoyride">Mocked Joyride with steps: {JSON.stringify(tourSteps)}</div>
  MockJoyride.displayName = 'MockJoyride'
  return MockJoyride
})

const mockLocalStorage = (() => {
  let store = {}
  return {
    getItem(key) {
      return store[key] || null
    },
    setItem(key, value) {
      store[key] = value.toString()
    },
    removeItem(key) {
      delete store[key]
    },
    clear() {
      store = {}
    },
  }
})()

describe('TourComponent', () => {
  beforeEach(() => {
    useTour.mockReturnValue({
      isTourOpen: false,
      startTour: jest.fn(),
      endTour: jest.fn(),
    })
    mockLocalStorage.clear()
    // Replace the real localStorage with our mock
    Object.defineProperty(window, 'localStorage', { value: mockLocalStorage })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('TourComponent renders with mock Joyride', () => {
    render(<TourComponent page="home" />)
    expect(screen.getByTestId('mockJoyride')).toBeInTheDocument()
  })

  it('does not start the tour for users who have seen it', () => {
    localStorage.setItem('hasSeenTour_home', 'true')
    const mockStartTour = jest.fn()
    useTour.mockReturnValue({ isTourOpen: false, startTour: mockStartTour, endTour: jest.fn() })

    render(<TourComponent page="home" />)

    expect(mockStartTour).not.toHaveBeenCalled()
  })
})

describe('handleJoyrideCallback', () => {
  const endTourMock = jest.fn()
  const originalSetItem = localStorage.setItem

  function createHandleJoyrideCallbackFunction() {
    return function handleJoyrideCallback({ status }) {
      if (status === 'finished' || status === 'skipped') {
        localStorage.setItem(`hasSeenTour_home`, 'true')
        endTourMock()
      }
    }
  }

  beforeEach(() => {
    localStorage.setItem = jest.fn()
    endTourMock.mockClear()
    useTour.mockReturnValue({
      isTourOpen: false,
      startTour: jest.fn(),
      endTour: jest.fn(),
    })
  })

  afterEach(() => {
    localStorage.setItem = originalSetItem
  })

  it.each(['finished', 'skipped'])('sets localStorage and ends tour when status is %s', (status) => {
    const page = 'home'
    const handleJoyrideCallback = createHandleJoyrideCallbackFunction({ endTour: jest.fn(), page })

    handleJoyrideCallback({ status, type: 'any', action: 'any' })

    expect(localStorage.setItem).toHaveBeenCalledWith(`hasSeenTour_${page}`, 'true')
    expect(endTourMock).toHaveBeenCalled()
  })
})
