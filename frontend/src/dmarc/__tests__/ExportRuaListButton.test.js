import React from 'react'
import { UserVarProvider } from '../../utilities/userState'
import { theme, ThemeProvider } from '@chakra-ui/react'
import { I18nProvider } from '@lingui/react'
import { i18n } from '@lingui/core'
import { MockedProvider } from '@apollo/client/testing'
import { waitFor, render, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { makeVar } from '@apollo/client'
import { ExportRuaListButton } from '../ExportRuaListButton'

describe('<ExportButton />', () => {
  it('renders without error', async () => {
    const { queryByText } = render(
      <MockedProvider>
        <UserVarProvider
          userVar={makeVar({
            jwt: null,
            tfaSendMethod: null,
            userName: null,
          })}
        >
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <MemoryRouter initialEntries={['/']} initialIndex={0}>
                <ExportRuaListButton />
              </MemoryRouter>
            </I18nProvider>
          </ThemeProvider>
        </UserVarProvider>
      </MockedProvider>,
    )
    await waitFor(() => {
      queryByText(/Export RUA List/i)
    })
  })
  it('button clicks', async () => {
    const { getByText } = render(
      <MockedProvider>
        <UserVarProvider
          userVar={makeVar({
            jwt: null,
            tfaSendMethod: null,
            userName: null,
          })}
        >
          <ThemeProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <MemoryRouter initialEntries={['/']} initialIndex={0}>
                <ExportRuaListButton />
              </MemoryRouter>
            </I18nProvider>
          </ThemeProvider>
        </UserVarProvider>
      </MockedProvider>,
    )
    const btn = getByText(/Export RUA List/i)
    fireEvent.click(btn)
  })
})
