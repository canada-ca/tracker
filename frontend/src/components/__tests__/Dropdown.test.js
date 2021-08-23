import React from 'react'
import { UserVarProvider } from '../../utilities/userState'
import { theme, ThemeProvider } from '@chakra-ui/react'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { MockedProvider } from '@apollo/client/testing'
import { waitFor, render, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { makeVar } from '@apollo/client'

import { Dropdown } from '../Dropdown'
import userEvent from '@testing-library/user-event'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: {},
  },
})

const handleSearch = jest.fn()

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
    const handleChange = jest.fn()

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
                  onSearch={handleSearch}
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
      const handleChange = jest.fn()

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
                    onSearch={handleSearch}
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
      const handleChange = jest.fn()

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
                    onSearch={handleSearch}
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
      const handleChange = jest.fn()

      const {
        queryByText,
        getByPlaceholderText,
        getByRole,
        findByText,
      } = render(
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
                    onSearch={handleSearch}
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

      const dropdownInput = getByRole('textbox', { name: /Dropdown Label/i })
      userEvent.click(dropdownInput)

      const andersonOption = await findByText(/Anderson and Sons/)
      expect(andersonOption).toBeVisible()

      expect(handleChange).toHaveBeenCalledTimes(0)

      userEvent.keyboard('[ArrowDown]')

      expect(handleChange).toHaveBeenCalledTimes(0)

      expect(andersonOption).toHaveFocus()

      userEvent.keyboard('[Enter]')

      expect(handleChange).toHaveBeenCalledTimes(1)
      expect(handleChange).toHaveBeenLastCalledWith({
        label: 'Anderson and Sons',
        value: {
          id: 'b4a524f0-0337-47c2-84ff-fcb7f8640f1f',
          slug: 'Anderson-and-Sons',
        },
      })

      userEvent.keyboard('[Escape]')

      expect(queryByText(/Anderson and Sons/)).not.toBeVisible()

      userEvent.keyboard('[ArrowUp]')

      expect(andersonOption).not.toHaveFocus()
    })
  })

  describe('search input', () => {
    it('calls search callback', async () => {
      const handleChange = jest.fn()
      const handleSearch = jest.fn()

      const { getByPlaceholderText, getByRole } = render(
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
                    onSearch={handleSearch}
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

      const dropdownInput = getByRole('textbox', { name: /Dropdown Label/i })
      userEvent.click(dropdownInput)

      userEvent.type(dropdownInput, 'search text')

      expect(handleSearch).toHaveBeenLastCalledWith('search text')
    })
  })
})
