import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { TourComponent } from '../components/TourComponent'
import { MockedProvider } from '@apollo/client/testing'
import { UserVarProvider } from '../../utilities/userState'
import { ApolloClient, makeVar } from '@apollo/client'
import { I18nProvider } from '@lingui/react'
import { ChakraProvider, theme } from '@chakra-ui/react'
import { MemoryRouter } from 'react-router-dom'
import { TourProvider } from '../contexts/TourContext'
import { setupI18n } from '@lingui/core'
import { en } from 'make-plural'
import { fireEvent } from '@testing-library/dom'
import { COMPLETE_TOUR } from '../../graphql/mutations'

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

const completedAt = new Date().toISOString()

const successMock = [
  {
    request: {
      query: COMPLETE_TOUR,
      variables: { tourId: 'landingPage' },
    },
    result: {
      data: {
        completeTour: {
          result: {
            __typename: 'CompleteTourResult',
            status: 'success',
            user: {
              id: 'users/someuser',
              completedTours: [{ tourId: 'landingPage', completedAt }],
            },
          },
        },
      },
    },
  },
]

describe('TourComponent', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })
  it('renders and completes the mocked landing page tour for users who have not seen it', async () => {
    const mutationSpy = jest.spyOn(ApolloClient.prototype, 'mutate')

    const { getByText, getByRole, queryByText } = render(
      <MockedProvider mocks={successMock} addTypename={false}>
        <UserVarProvider
          userVar={makeVar({
            jwt: null,
            tfaSendMethod: null,
            userName: 'test@example.com',
            completedTours: [],
            emailValidated: true,
          })}
        >
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

    await waitFor(async () => {
      // wait for the mutation promise to resolve
      await mutationSpy.mock.results[0].value
    })

    expect(mutationSpy.mock.calls.length).toBe(1)
    expect(COMPLETE_TOUR).toBeDefined()
    expect(mutationSpy.mock.calls[0][0].mutation).toBe(COMPLETE_TOUR)
    expect(mutationSpy.mock.calls[0][0].variables.tourId).toEqual('landingPage')
  })

  it('does not render the tour for users who have seen it', async () => {
    const { queryByText } = render(
      <MockedProvider mocks={[]} addTypename={false}>
        <UserVarProvider
          userVar={makeVar({ jwt: null, userName: 'test@example.com', completedTours: ['landingPage'] })}
        >
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

    expect(queryByText(/Landing Step 1/)).toBeNull()
  })

  it('does not render the tour for users who are not logged in', async () => {
    const { queryByText } = render(
      <MockedProvider mocks={[]} addTypename={false}>
        <UserVarProvider userVar={makeVar({ jwt: null, userName: null })}>
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

    expect(queryByText(/Landing Step 1/)).toBeNull()
  })
})
