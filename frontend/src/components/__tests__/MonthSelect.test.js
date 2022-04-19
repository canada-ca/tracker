import React from 'react'
import { UserVarProvider } from '../../utilities/userState'
import { theme, ThemeProvider } from '@chakra-ui/react'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { MockedProvider } from '@apollo/client/testing'
import { waitFor, render, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { makeVar } from '@apollo/client'

import { MonthSelect } from '../MonthSelect'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: {},
  },
})

const handleChange = jest.fn()

describe('<MonthSelect />', () => {
  it('renders without error', async () => {
    const { getByDisplayValue } = render(
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
                <MonthSelect
                  id="month-select"
                  selectedValue="LAST30DAYS"
                  handleChange={handleChange}
                />
              </MemoryRouter>
            </I18nProvider>
          </ThemeProvider>
        </UserVarProvider>
      </MockedProvider>,
    )
    await waitFor(() => {
      getByDisplayValue(/Last 30 Days/i)
    })
  })
  it('opens and closes', async () => {
    const { getByDisplayValue, queryByText } = render(
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
                <MonthSelect
                  id="month-select"
                  selectedValue="LAST30DAYS"
                  handleChange={handleChange}
                />
              </MemoryRouter>
            </I18nProvider>
          </ThemeProvider>
        </UserVarProvider>
      </MockedProvider>,
    )
    await waitFor(() => {
      getByDisplayValue(/Last 30 Days/i)
    })

    const monthSelect = getByDisplayValue(/Last 30 Days/i)
    fireEvent.click(monthSelect)
    await waitFor(() => {
      expect(queryByText(/OCTOBER/))
    })
    fireEvent.blur(monthSelect)
  })
  it('changes value on selection', async () => {
    const { getByDisplayValue, queryByText, getByText } = render(
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
                <MonthSelect
                  id="month-select"
                  selectedValue="LAST30DAYS"
                  handleChange={handleChange}
                />
              </MemoryRouter>
            </I18nProvider>
          </ThemeProvider>
        </UserVarProvider>
      </MockedProvider>,
    )
    await waitFor(() => {
      getByDisplayValue(/Last 30 Days/i)
    })

    const monthSelect = getByDisplayValue(/Last 30 Days/i)
    fireEvent.click(monthSelect)
    await waitFor(() => {
      expect(queryByText(/OCTOBER/))
    })

    const opt1 = getByText(/OCTOBER/)
    fireEvent.click(opt1)
  })
})
