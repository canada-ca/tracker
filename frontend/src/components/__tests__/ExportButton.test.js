import React from 'react'
import { UserVarProvider } from '../../utilities/userState'
import { theme, ThemeProvider } from '@chakra-ui/react'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { MockedProvider } from '@apollo/client/testing'
import { waitFor, render, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { makeVar } from '@apollo/client'

import { ExportButton } from '../ExportButton'

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
    key: 'value1',
  },
  {
    key: 'value2',
  },
  {
    key: 'value3',
  },
]

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
                <ExportButton jsonData={mocks} fileName="ExportButton-test" />
              </MemoryRouter>
            </I18nProvider>
          </ThemeProvider>
        </UserVarProvider>
      </MockedProvider>,
    )
    await waitFor(() => {
      queryByText(/Export to CSV/i)
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
                <ExportButton jsonData={mocks} fileName="ExportButton-test" />
              </MemoryRouter>
            </I18nProvider>
          </ThemeProvider>
        </UserVarProvider>
      </MockedProvider>,
    )
    const btn = getByText(/Export to CSV/i)
    fireEvent.click(btn)
  })
  describe('when button is clicked', () => {
    it('displays popover', async () => {
      const { getByText, queryByRole } = render(
        <MockedProvider>
          <UserVarProvider
            userVar={makeVar({
              jwt: 'fgdgsdfgvrd',
              tfaSendMethod: null,
              userName: 'a@a.a',
              insideUser: true,
            })}
          >
            <ThemeProvider theme={theme}>
              <I18nProvider i18n={i18n}>
                <MemoryRouter initialEntries={['/']} initialIndex={0}>
                  <ExportButton jsonData={mocks} fileName="ExportButton-test" />
                </MemoryRouter>
              </I18nProvider>
            </ThemeProvider>
          </UserVarProvider>
        </MockedProvider>,
      )
      const btn = getByText(/Export to CSV/i)
      fireEvent.click(btn)
      // Popover should now be visible
      await waitFor(() => {
        expect(queryByRole('dialog')).toBeInTheDocument()
      })
    })
    describe('in popover', () => {
      it('displays file name input', async () => {
        const { getByText, getByLabelText } = render(
          <MockedProvider>
            <UserVarProvider
              userVar={makeVar({
                jwt: 'fgdgsdfgvrd',
                tfaSendMethod: null,
                userName: 'a@a.a',
                insideUser: true,
              })}
            >
              <ThemeProvider theme={theme}>
                <I18nProvider i18n={i18n}>
                  <MemoryRouter initialEntries={['/']} initialIndex={0}>
                    <ExportButton jsonData={mocks} fileName="ExportButton-test" />
                  </MemoryRouter>
                </I18nProvider>
              </ThemeProvider>
            </UserVarProvider>
          </MockedProvider>,
        )
        const btn = getByText(/Export to CSV/i)
        fireEvent.click(btn)
        // File name input should be visible
        await waitFor(() => {
          expect(getByLabelText(/File name:/i)).toBeInTheDocument()
        })
      })
      it('button clicks', async () => {
        const { getByText, getByLabelText } = render(
          <MockedProvider>
            <UserVarProvider
              userVar={makeVar({
                jwt: 'fgdgsdfgvrd',
                tfaSendMethod: null,
                userName: 'a@a.a',
                insideUser: true,
              })}
            >
              <ThemeProvider theme={theme}>
                <I18nProvider i18n={i18n}>
                  <MemoryRouter initialEntries={['/']} initialIndex={0}>
                    <ExportButton jsonData={mocks} fileName="ExportButton-test" />
                  </MemoryRouter>
                </I18nProvider>
              </ThemeProvider>
            </UserVarProvider>
          </MockedProvider>,
        )
        const btn = getByText(/Export to CSV/i)
        fireEvent.click(btn)
        // Change file name
        const input = getByLabelText(/File name:/i)
        fireEvent.change(input, { target: { value: 'custom-file-name' } })
        // Click Download
        const downloadBtn = getByText(/Download/i)
        fireEvent.click(downloadBtn)
      })
    })
  })
})
