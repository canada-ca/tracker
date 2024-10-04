import React from 'react'
import { UserVarProvider } from '../utilities/userState'
import { theme, ChakraProvider } from '@chakra-ui/react'
import { I18nProvider } from '@lingui/react'
import { i18n } from '@lingui/core'
import { MockedProvider } from '@apollo/client/testing'
import { waitFor, render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { makeVar } from '@apollo/client'
import userEvent from '@testing-library/user-event'
import { LocaleSwitcher } from '../app/LocaleSwitcher'
import { activate, defaultLocale } from '../utilities/i18n.config'

describe('<LocaleSwitcher />', () => {
  it('switches the locale with clicked', async () => {
    await activate(defaultLocale)

    const { getByRole } = render(
      <MockedProvider>
        <UserVarProvider
          userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}
        >
          <I18nProvider i18n={i18n}>
            <ChakraProvider theme={theme}>
              <MemoryRouter initialEntries={['/admin']} initialIndex={0}>
                <LocaleSwitcher />
              </MemoryRouter>
            </ChakraProvider>
          </I18nProvider>
        </UserVarProvider>
      </MockedProvider>,
    )

    expect(i18n.locale).toEqual('en')

    const localeSwitcherButton = getByRole('button', { name: /Français/i })

    userEvent.click(localeSwitcherButton)

    await waitFor(() => expect(i18n.locale).toEqual('fr'))
  })
})
