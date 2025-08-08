import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'
import { MockedProvider } from '@apollo/client/testing'
import { EditableEmailUpdateOptions } from '../EditableEmailUpdateOptions'
import { UPDATE_USER_PROFILE } from '../../graphql/mutations'
import { useUserVar } from '../../utilities/userState'
import { ChakraProvider } from '@chakra-ui/react'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'

jest.mock('../../utilities/userState', () => ({
  useUserVar: jest.fn(),
}))

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: {},
  },
})

const mocks = [
  {
    request: {
      query: UPDATE_USER_PROFILE,
      variables: {
        emailUpdateOptions: {
          orgFootprint: true,
          progressReport: false,
          detectDecay: false,
        },
      },
    },
    result: {
      data: {
        updateUserProfile: {
          result: {
            __typename: 'UpdateUserProfileResult',
            user: {
              emailUpdateOptions: {
                orgFootprint: true,
                progressReport: false,
                detectDecay: false,
              },
            },
          },
        },
      },
    },
  },
]

describe('EditableEmailSubscriptionOptions', () => {
  const mockLogin = jest.fn()
  const mockCurrentUser = { emailUpdateOptions: { orgFootprint: false, progressReport: false, detectDecay: false } }

  beforeEach(() => {
    useUserVar.mockReturnValue({
      login: mockLogin,
      currentUser: mockCurrentUser,
    })
  })

  it('renders without crashing', () => {
    const { getByText } = render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <I18nProvider i18n={i18n}>
          <ChakraProvider>
            <EditableEmailUpdateOptions emailUpdateOptions={{ orgFootprint: false, progressReport: false, detectDecay: false }} />
          </ChakraProvider>
        </I18nProvider>
      </MockedProvider>,
    )
    expect(getByText('Email Update Preferences:')).toBeInTheDocument()
  })

  it('opens the modal when edit button is clicked', () => {
    const { getByText, getByRole } = render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <I18nProvider i18n={i18n}>
          <ChakraProvider>
            <EditableEmailUpdateOptions emailUpdateOptions={{ orgFootprint: false, progressReport: false, detectDecay: false }} />
          </ChakraProvider>
        </I18nProvider>
      </MockedProvider>,
    )
    fireEvent.click(getByText('Edit'))
    expect(getByRole('dialog')).toBeInTheDocument()
  })

  it('submits the form and updates user profile', async () => {
    const { getByText, getByLabelText } = render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <I18nProvider i18n={i18n}>
          <ChakraProvider>
            <EditableEmailUpdateOptions emailUpdateOptions={{ orgFootprint: false, progressReport: false, detectDecay: false }} />
          </ChakraProvider>
        </I18nProvider>
      </MockedProvider>,
    )
    fireEvent.click(getByText('Edit'))
    fireEvent.click(getByLabelText('Recent Activity'))
    fireEvent.click(getByText('Confirm'))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        ...mockCurrentUser,
        emailUpdateOptions: { orgFootprint: true, progressReport: false, detectDecay: false },
      })
    })
  })
})
