import React from 'react'
import { theme, ChakraProvider } from '@chakra-ui/react'
import { MemoryRouter } from 'react-router-dom'
import { cleanup, render, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import { I18nProvider } from '@lingui/react'
import { i18n } from '@lingui/core'
import { makeVar } from '@apollo/client'
import { en } from 'make-plural/plurals'
import ReadGuidancePage from '../ReadGuidancePage'
import { UserVarProvider } from '../../utilities/userState'

describe('<ReadGuidancePage />', () => {
  afterEach(cleanup)

  it('renders the page', async () => {
    const { getByText } = render(
      <MockedProvider>
        <UserVarProvider
          userVar={makeVar({
            jwt: null,
            tfaSendMethod: null,
            userName: null,
          })}
        >
          <ChakraProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <MemoryRouter initialEntries={['/']} initialIndex={0}>
                <ReadGuidancePage />
              </MemoryRouter>
            </I18nProvider>
          </ChakraProvider>
        </UserVarProvider>
      </MockedProvider>,
    )
    await waitFor(() =>
      expect(getByText('Getting Started')).toBeInTheDocument(),
    )
  })
})
