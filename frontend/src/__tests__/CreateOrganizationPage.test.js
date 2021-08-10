import React from 'react'
import { theme, ChakraProvider } from '@chakra-ui/react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import CreateOrganizationPage from '../CreateOrganizationPage'
import { CREATE_ORGANIZATION } from '../graphql/mutations'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { UserVarProvider } from '../UserState'
import { makeVar } from '@apollo/client'
import { en } from 'make-plural/plurals'
import userEvent from '@testing-library/user-event'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: { plurals: en },
  },
})

const mocks = [
  {
    request: {
      query: CREATE_ORGANIZATION,
      variables: {
        nameEN: 'Test Org Name EN',
        nameFR: 'Test Org Name FR',
        acronymEN: 'TESTACREN',
        acronymFR: 'TESTACRFR',
        cityEN: 'Test Org City EN',
        cityFR: 'Test Org City FR',
        provinceEN: 'Test Org Province EN',
        provinceFR: 'Test Org Province FR',
        countryEN: 'Test Org Country EN',
        countryFR: 'Test Org Country FR',
        zoneEN: '',
        zoneFR: '',
        sectorEN: '',
        sectorFR: '',
      },
    },
    result: {
      data: {
        createOrganization: {
          result: {
            name: 'Test Org Name EN',
            __typename: 'Organization',
          },
        },
      },
    },
  },
]

describe('<CreateOrganizationPage />', () => {
  it('renders', async () => {
    const { getByText } = render(
      <MockedProvider mocks={mocks}>
        <UserVarProvider
          userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}
        >
          <ChakraProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <MemoryRouter initialEntries={['/']} initialIndex={0}>
                <CreateOrganizationPage />
              </MemoryRouter>
            </I18nProvider>
          </ChakraProvider>
        </UserVarProvider>
      </MockedProvider>,
    )

    const welcomeMessage = /Create an organization/i

    await waitFor(() => expect(getByText(welcomeMessage)).toBeInTheDocument())
  })

  describe('acronym fields', () => {
    it('displays an error message when incorrect format is used', async () => {
      const { container, getByText } = render(
        <MockedProvider mocks={mocks}>
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
                  <CreateOrganizationPage />
                </MemoryRouter>
              </I18nProvider>
            </ChakraProvider>
          </UserVarProvider>
        </MockedProvider>,
      )

      const acronymEN = container.querySelector('#acronymEN')
      const errorMessage = /Acronyms can only use upper case letters and underscores/i

      await waitFor(() => {
        fireEvent.change(acronymEN, { target: { value: 'test' } })
      })

      await waitFor(() => {
        fireEvent.blur(acronymEN)
      })

      await waitFor(() => expect(getByText(errorMessage)).toBeInTheDocument())
    })

    it('displays an error message when input is too large', async () => {
      const { container, getByText } = render(
        <MockedProvider mocks={mocks}>
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
                  <CreateOrganizationPage />
                </MemoryRouter>
              </I18nProvider>
            </ChakraProvider>
          </UserVarProvider>
        </MockedProvider>,
      )

      const acronymEN = container.querySelector('#acronymEN')
      const errorMessage = /Acronyms must be at most 50 characters/i

      await waitFor(() => {
        fireEvent.change(acronymEN, {
          target: {
            value:
              'THIS_ACRONYM_IS_OVER_FIFTY_CHARACTERS_WHICH_MAKES_IT_INVALID',
          },
        })
      })

      await waitFor(() => {
        fireEvent.blur(acronymEN)
      })

      await waitFor(() => expect(getByText(errorMessage)).toBeInTheDocument())
    })
  })
  describe('submits proper org creation data', () => {
    it('successfully create org and displays message', async () => {
      const { getByRole, findByText } = render(
        <MockedProvider mocks={mocks}>
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
                  <CreateOrganizationPage />
                </MemoryRouter>
              </I18nProvider>
            </ChakraProvider>
          </UserVarProvider>
        </MockedProvider>,
      )

      const nameENInput = getByRole('textbox', { name: /Name \(English\)/ })
      const nameFRInput = getByRole('textbox', { name: /Name \(French\)/ })

      const acronymENInput = getByRole('textbox', {
        name: /Acronym \(English\)/,
      })
      const acronymFRInput = getByRole('textbox', {
        name: /Acronym \(French\)/,
      })

      const cityENInput = getByRole('textbox', { name: /City \(English\)/ })
      const cityFRInput = getByRole('textbox', { name: /City \(French\)/ })

      const provinceENInput = getByRole('textbox', {
        name: /Province \(English\)/,
      })
      const provinceFRInput = getByRole('textbox', {
        name: /Province \(French\)/,
      })

      const countryENInput = getByRole('textbox', {
        name: /Country \(English\)/,
      })
      const countryFRInput = getByRole('textbox', {
        name: /Country \(French\)/,
      })

      userEvent.type(nameENInput, 'Test Org Name EN')
      userEvent.type(nameFRInput, 'Test Org Name FR')

      userEvent.type(acronymENInput, 'TESTACREN')
      userEvent.type(acronymFRInput, 'TESTACRFR')

      userEvent.type(cityENInput, 'Test Org City EN')
      userEvent.type(cityFRInput, 'Test Org City FR')

      userEvent.type(provinceENInput, 'Test Org Province EN')
      userEvent.type(provinceFRInput, 'Test Org Province FR')

      userEvent.type(countryENInput, 'Test Org Country EN')
      userEvent.type(countryFRInput, 'Test Org Country FR')

      const createOrganizationButton = getByRole('button', {
        name: /Create Organization/,
      })
      userEvent.click(createOrganizationButton)

      const orgCreationToast = await findByText(/Test Org Name EN was created/)
      await waitFor(() => expect(orgCreationToast).toBeVisible())
    })
  })

  describe('submits improper org creation data', () => {
    const improperCreationMocks = [
      {
        request: {
          query: CREATE_ORGANIZATION,
          variables: {
            nameEN: 'Test Org Name EN',
            nameFR: 'Test Org Name FR',
            acronymEN: 'TESTACREN',
            acronymFR: 'TESTACRFR',
            cityEN: 'Test Org City EN',
            cityFR: 'Test Org City FR',
            provinceEN: 'Test Org Province EN',
            provinceFR: 'Test Org Province FR',
            countryEN: 'Test Org Country EN',
            countryFR: 'Test Org Country FR',
            zoneEN: '',
            zoneFR: '',
            sectorEN: '',
            sectorFR: '',
          },
        },
        result: {
          data: {
            createOrganization: {
              result: {
                code: 400,
                description: 'Improper Information Given',
                __typename: 'OrganizationError',
              },
            },
          },
        },
      },
    ]

    it('displays error received from api', async () => {
      const { getByRole, findByText } = render(
        <MockedProvider mocks={improperCreationMocks}>
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
                  <CreateOrganizationPage />
                </MemoryRouter>
              </I18nProvider>
            </ChakraProvider>
          </UserVarProvider>
        </MockedProvider>,
      )

      const nameENInput = getByRole('textbox', {
        name: /Name \(English\)/,
      })
      const nameFRInput = getByRole('textbox', { name: /Name \(French\)/ })

      const acronymENInput = getByRole('textbox', {
        name: /Acronym \(English\)/,
      })
      const acronymFRInput = getByRole('textbox', {
        name: /Acronym \(French\)/,
      })

      const cityENInput = getByRole('textbox', { name: /City \(English\)/ })
      const cityFRInput = getByRole('textbox', { name: /City \(French\)/ })

      const provinceENInput = getByRole('textbox', {
        name: /Province \(English\)/,
      })
      const provinceFRInput = getByRole('textbox', {
        name: /Province \(French\)/,
      })

      const countryENInput = getByRole('textbox', {
        name: /Country \(English\)/,
      })
      const countryFRInput = getByRole('textbox', {
        name: /Country \(French\)/,
      })

      userEvent.type(nameENInput, 'Test Org Name EN')
      userEvent.type(nameFRInput, 'Test Org Name FR')

      userEvent.type(acronymENInput, 'TESTACREN')
      userEvent.type(acronymFRInput, 'TESTACRFR')

      userEvent.type(cityENInput, 'Test Org City EN')
      userEvent.type(cityFRInput, 'Test Org City FR')

      userEvent.type(provinceENInput, 'Test Org Province EN')
      userEvent.type(provinceFRInput, 'Test Org Province FR')

      userEvent.type(countryENInput, 'Test Org Country EN')
      userEvent.type(countryFRInput, 'Test Org Country FR')

      const createOrganizationButton = getByRole('button', {
        name: /Create Organization/,
      })
      userEvent.click(createOrganizationButton)

      const orgCreationToast = await findByText(/Improper Information Given/)
      await waitFor(() => expect(orgCreationToast).toBeVisible())
    })
  })
})
