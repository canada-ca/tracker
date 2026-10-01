import React from 'react'
import { UserVarProvider } from '../../utilities/userState'
import { theme, ThemeProvider } from '@chakra-ui/react'
import { I18nProvider } from '@lingui/react'
import { i18n } from '@lingui/core'
import { MockedProvider } from '@apollo/client/testing'
import { waitFor, render, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { makeVar } from '@apollo/client'
import { MonthSelect } from '../MonthSelect'
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
      expect(queryByText(/Last 30 Days/))
    })
    fireEvent.blur(monthSelect)
  })
  it('offers the last 30 days and the current month plus the eleven before it', () => {
    const { getAllByRole } = render(
      <ThemeProvider theme={theme}>
        <I18nProvider i18n={i18n}>
          <MonthSelect id="month-select" selectedValue="LAST30DAYS" handleChange={handleChange} />
        </I18nProvider>
      </ThemeProvider>,
    )

    const monthValue = (monthsAgo) => {
      const date = new Date()
      date.setDate(1)
      date.setMonth(date.getMonth() - monthsAgo)
      return `${date.toLocaleString('en', { month: 'long' }).toUpperCase()}, ${date.getFullYear()}`
    }

    expect(getAllByRole('option').map((option) => option.value)).toEqual([
      `LAST30DAYS, ${new Date().getFullYear()}`,
      ...Array.from({ length: 12 }, (_, monthsAgo) => monthValue(monthsAgo)),
    ])
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
      expect(queryByText(/Last 30 Days/))
    })

    const opt1 = getByText(/Last 30 Days/)
    fireEvent.click(opt1)
  })
})
