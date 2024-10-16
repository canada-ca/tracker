import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { TourComponent } from '../components/TourComponent'
import { useTour } from '../hooks/useTour'
import { MockedProvider } from '@apollo/client/testing'
import { UserVarProvider } from '../../utilities/userState'
import { makeVar } from '@apollo/client'
import { I18nProvider } from '@lingui/react'
import { ChakraProvider, theme } from '@chakra-ui/react'
import { MemoryRouter } from 'react-router-dom'
import { TourProvider } from '../contexts/TourContext'
import { setupI18n } from '@lingui/core'
import { en } from 'make-plural'
import { fireEvent, screen } from '@testing-library/dom'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: { plurals: en },
  },
})

jest.mock('../config/tourSteps', () => ({
  mainTourSteps: {
    landingPage: {
      requiresAuth: false,
      steps: [
        {
          target: '.step-1',
          content: 'Landing Step 1',
          disableBeacon: true,
        },
        {
          target: '.step-2',
          content: 'Landing Step 2',
          disableBeacon: true,
        },
      ],
    },
  },
}))

describe('TourComponent', () => {
  afterEach(() => {
    localStorage.clear()
  })

  it('renders the mocked landing page tour for users who have not seen it', async () => {
    expect(localStorage.getItem('hasSeenTour_landingPage')).toBe(null)

    const { getByText, getByRole, queryByText } = render(
      <MockedProvider mocks={[]} addTypename={false}>
        <UserVarProvider userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}>
          <I18nProvider i18n={i18n}>
            <ChakraProvider theme={theme}>
              <MemoryRouter initialEntries={['']} initialIndex={0}>
                <TourProvider>
                  <TourComponent />
                  <p className="step-1">Test 1</p>
                  <p className="step-2">Test 2</p>
                </TourProvider>
              </MemoryRouter>
            </ChakraProvider>
          </I18nProvider>
        </UserVarProvider>
      </MockedProvider>,
    )

    // Element will exist but not be visible
    expect(getByText(/Landing Step 1/)).not.toBeNull()

    await waitFor(() => {
      expect(getByText(/Landing Step 1/)).toBeVisible()
    })

    let nextBtn = getByRole('button', { name: /Next/ })

    expect(nextBtn).toBeInTheDocument()

    fireEvent.click(nextBtn)

    await waitFor(() => {
      expect(getByText(/Landing Step 2/)).toBeVisible()
    })

    nextBtn = getByRole('button', { name: /Finish/ })

    expect(nextBtn).toBeInTheDocument()

    fireEvent.click(nextBtn)

    await waitFor(() => {
      expect(queryByText(/Landing Step 2/)).toBeNull()
    })

    // Ensure that the tour has been marked as seen
    expect(localStorage.getItem('hasSeenTour_landingPage')).toBe('true')
  })

  it('does not render the tour for users who have seen it', async () => {
    localStorage.setItem('hasSeenTour_landingPage', 'true')

    expect(localStorage.getItem('hasSeenTour_landingPage')).toBe('true')

    const { queryByText } = render(
      <MockedProvider mocks={[]} addTypename={false}>
        <UserVarProvider userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}>
          <I18nProvider i18n={i18n}>
            <ChakraProvider theme={theme}>
              <MemoryRouter initialEntries={['']} initialIndex={0}>
                <TourProvider>
                  <TourComponent />
                  <p className="step-1">Test 1</p>
                  <p className="step-2">Test 2</p>
                </TourProvider>
              </MemoryRouter>
            </ChakraProvider>
          </I18nProvider>
        </UserVarProvider>
      </MockedProvider>,
    )

    // Element should not exist
    expect(queryByText(/Landing Step 1/)).toBeNull()
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
