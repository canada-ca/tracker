import React from 'react'
import { UserVarProvider } from '../UserState'
import { theme, ThemeProvider } from '@chakra-ui/react'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { MockedProvider } from '@apollo/client/testing'
import { waitFor, render, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { makeVar } from '@apollo/client'
import { Dropdown } from '../Dropdown'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: {},
  },
})

const handleChange = () => {}

describe('<Dropdown />', () => {
  const mocks = [
    {
      label: 'Anderson and Sons',
      value: {
        slug: 'Anderson-and-Sons',
        id: 'b4a524f0-0337-47c2-84ff-fcb7f8640f1f',
      },
    },
    {
      label: 'Tremblay, Conroy and Breitenberg',
      value: {
        slug: 'Tremblay-Conroy-and-Breitenberg',
        id: 'b711b24-39f0-40ac-b06d-39af2e87650f',
      },
    },
    {
      label: 'Aufderhar - Nader',
      value: {
        slug: 'Aufderhar---Nader',
        id: '26cd0f55-f167-427b-9170-ef515ac5443',
      },
    },
  ]

  it('renders without error', async () => {
    const { getByText, getByPlaceholderText } = render(
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
                <Dropdown
                  label="Dropdown Label"
                  labelDirection="row"
                  options={mocks}
                  placeholder="Select an option"
                  onChange={handleChange}
                />
              </MemoryRouter>
            </I18nProvider>
          </ThemeProvider>
        </UserVarProvider>
      </MockedProvider>,
    )
    await waitFor(() => {
      getByText(/Dropdown label/i)
      getByPlaceholderText(/Select an option/)
    })
  })

  // open and close select
  describe('options list', () => {
    it('can be opened and closed', async () => {
      const { getByText, getByPlaceholderText, queryByText } = render(
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
                  <Dropdown
                    label="Dropdown Label"
                    labelDirection="row"
                    options={mocks}
                    placeholder="Select an option"
                    onChange={handleChange}
                  />
                </MemoryRouter>
              </I18nProvider>
            </ThemeProvider>
          </UserVarProvider>
        </MockedProvider>,
      )
      await waitFor(() => {
        getByPlaceholderText(/Select an option/)
      })

      const dropdown = getByText(/Dropdown label/i)
      fireEvent.click(dropdown)
      await waitFor(() => {
        expect(queryByText(/Anderson and Sons/)).toBeInTheDocument()
      })
      fireEvent.blur(dropdown)
    })

    // make selection via mouse
    it('executes change on selection', async () => {
      const { getByText, getByPlaceholderText, queryByText } = render(
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
                  <Dropdown
                    label="Dropdown Label"
                    labelDirection="row"
                    options={mocks}
                    placeholder="Select an option"
                    onChange={handleChange}
                  />
                </MemoryRouter>
              </I18nProvider>
            </ThemeProvider>
          </UserVarProvider>
        </MockedProvider>,
      )
      await waitFor(() => {
        getByPlaceholderText(/Select an option/)
      })

      const dropdown = getByText(/Dropdown label/i)
      fireEvent.click(dropdown)
      await waitFor(() => {
        expect(queryByText(/Anderson and Sons/)).toBeInTheDocument()
      })

      const opt1 = getByText(/Anderson and Sons/)
      fireEvent.click(opt1)
    })

    // make selection via keyboard
    it('executes change on selection', async () => {
      const { getByText, getByPlaceholderText, queryByText } = render(
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
                  <Dropdown
                    label="Dropdown Label"
                    labelDirection="row"
                    options={mocks}
                    placeholder="Select an option"
                    onChange={handleChange}
                  />
                </MemoryRouter>
              </I18nProvider>
            </ThemeProvider>
          </UserVarProvider>
        </MockedProvider>,
      )
      await waitFor(() => {
        getByPlaceholderText(/Select an option/)
      })

      const dropdown = getByText(/Dropdown label/i)
      fireEvent.keyDown(dropdown, { key: 'Enter', code: 'Enter' })
      await waitFor(() => {
        expect(queryByText(/Anderson and Sons/)).toBeInTheDocument()
      })

      const opt1 = getByText(/Anderson and Sons/)
      const opt2 = getByText(/Tremblay, Conroy and Breitenberg/)

      fireEvent.keyDown(dropdown, { key: 'ArrowDown', code: 'ArrowDown' })
      fireEvent.keyDown(opt1, { key: 'ArrowDown', code: 'ArrowDown' })
      fireEvent.keyDown(opt2, { key: 'ArrowUp', code: 'ArrowUp' })
      fireEvent.keyDown(opt1, { key: 'Enter', code: 'Enter' })
    })
  })

  // filter options with input
  describe('search input', () => {
    it('filters selectable options', async () => {
      const { getByText, getByPlaceholderText, queryByText } = render(
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
                  <Dropdown
                    label="Dropdown Label"
                    labelDirection="row"
                    options={mocks}
                    placeholder="Select an option"
                    onChange={handleChange}
                  />
                </MemoryRouter>
              </I18nProvider>
            </ThemeProvider>
          </UserVarProvider>
        </MockedProvider>,
      )
      await waitFor(() => {
        getByText(/Dropdown label/i)
        expect(queryByText(/Anderson and Sons/)).toBeInTheDocument()
      })

      const input = getByPlaceholderText(/Select an option/)
      fireEvent.change(input, { value: 'Tre' })

      // await waitFor(() => {
      //   expect(queryByText('Tre')).toBeInTheDocument()
      // })
    })
  })
})
