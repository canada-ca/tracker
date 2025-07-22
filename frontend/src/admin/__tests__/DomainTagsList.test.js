import React from 'react'
import { ChakraProvider, theme } from '@chakra-ui/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { makeVar } from '@apollo/client'
import { en } from 'make-plural/plurals'
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import { DomainTagsList } from '../DomainTagsList'
import { DOMAIN_TAGS } from '../../graphql/queries'
import { CREATE_TAG, UPDATE_TAG } from '../../graphql/mutations'
import { UserVarProvider } from '../../utilities/userState'
import '@testing-library/jest-dom'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: { plurals: en },
  },
})

jest.mock('@chakra-ui/react', () => {
  const actual = jest.requireActual('@chakra-ui/react')
  return {
    ...actual,
    useToast: () => jest.fn(),
  }
})

jest.mock('@lingui/macro', () => ({
  t: (str) => str,
  Trans: ({ children }) => children,
}))

jest.mock('../../utilities/fieldRequirements', () => {
  const Yup = require('yup')
  return {
    getRequirement: () => ({ required: true }),
    schemaToValidation: () =>
      Yup.object().shape({
        labelEn: Yup.string().required(),
        labelFr: Yup.string(),
        isVisible: Yup.boolean(),
        ownership: Yup.string(),
      }),
  }
})

jest.mock('../../components/LoadingMessage', () => ({
  LoadingMessage: () => <div data-testid="loading">Loading...</div>,
}))

jest.mock('../../components/ErrorFallbackMessage', () => ({
  ErrorFallbackMessage: () => <div data-testid="error">Error!</div>,
}))

const mockTags = [
  {
    tagId: '1',
    label: 'Important',
    description: 'Critical tag',
    isVisible: true,
    ownership: 'GLOBAL',
    _organizations: [],
  },
  {
    tagId: '2',
    label: 'Archived',
    description: 'No longer used',
    isVisible: false,
    ownership: 'ORG',
    _organizations: [],
  },
]

const mocks = [
  {
    request: {
      query: DOMAIN_TAGS,
    },
    result: {
      data: {
        findAllTags: mockTags,
      },
    },
  },
  {
    request: {
      query: CREATE_TAG,
      variables: {
        labelEn: '',
        labelFr: '',
        descriptionEn: '',
        descriptionFr: '',
        isVisible: true,
        ownership: '',
      },
    },
    result: {
      data: {
        createTag: {
          result: {
            __typename: 'Tag',
            tag: 'NewTag',
          },
        },
      },
    },
  },
  {
    request: {
      query: UPDATE_TAG,
      variables: {
        tagId: '1',
        labelEn: 'Updated',
      },
    },
    result: {
      data: {
        updateTag: {
          result: {
            __typename: 'Tag',
            tagId: '1',
          },
        },
      },
    },
  },
]

const noTagsMocks = [
  {
    request: {
      query: DOMAIN_TAGS,
    },
    result: {
      data: {
        findAllTags: [],
      },
    },
  },
  {
    request: {
      query: CREATE_TAG,
      variables: {
        labelEn: '',
        labelFr: '',
        descriptionEn: '',
        descriptionFr: '',
        isVisible: true,
        ownership: '',
      },
    },
    result: {
      data: {
        createTag: {
          result: {
            __typename: 'Tag',
            tag: 'NewTag',
          },
        },
      },
    },
  },
  {
    request: {
      query: UPDATE_TAG,
      variables: {
        tagId: '1',
        labelEn: 'Updated',
      },
    },
    result: {
      data: {
        updateTag: {
          result: {
            __typename: 'Tag',
            tagId: '1',
          },
        },
      },
    },
  },
]

describe('DomainTagsList', () => {
  it('renders loading state', () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <UserVarProvider
          userVar={makeVar({
            jwt: null,
            tfaSendMethod: null,
            userName: null,
          })}
        >
          <ChakraProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <MemoryRouter initialEntries={['/domains']} initialIndex={0}>
                <DomainTagsList />
              </MemoryRouter>
            </I18nProvider>
          </ChakraProvider>
        </UserVarProvider>
      </MockedProvider>,
    )
    expect(screen.getByTestId('loading')).toBeInTheDocument()
  })

  it('renders error state', async () => {
    const errorMock = [
      {
        request: { query: DOMAIN_TAGS },
        error: new Error('GraphQL error: Failed to fetch'),
      },
    ]

    render(
      <MockedProvider mocks={errorMock} addTypename={false}>
        <UserVarProvider
          userVar={makeVar({
            jwt: null,
            tfaSendMethod: null,
            userName: null,
          })}
        >
          <ChakraProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <MemoryRouter initialEntries={['/domains']} initialIndex={0}>
                <DomainTagsList />
              </MemoryRouter>
            </I18nProvider>
          </ChakraProvider>
        </UserVarProvider>
      </MockedProvider>,
    )

    await waitFor(() => screen.getByTestId('error'))
    expect(screen.getByTestId('error')).toBeInTheDocument()
  })

  it('renders tags and allows toggling edit forms', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <UserVarProvider
          userVar={makeVar({
            jwt: null,
            tfaSendMethod: null,
            userName: null,
          })}
        >
          <ChakraProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <MemoryRouter initialEntries={['/domains']} initialIndex={0}>
                <DomainTagsList />
              </MemoryRouter>
            </I18nProvider>
          </ChakraProvider>
        </UserVarProvider>
      </MockedProvider>,
    )

    await waitFor(() => screen.getByText(/IMPORTANT/i))
    expect(screen.getByText(/ARCHIVED/i)).toBeInTheDocument()

    const editButtons = screen.getAllByRole('button', { name: /edit/i })
    fireEvent.click(editButtons[0])
    await waitFor(() => screen.getByLabelText(/ownership/i))
    expect(screen.getByLabelText(/ownership/i)).toBeInTheDocument()
  })

  it('opens and closes create form', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <UserVarProvider
          userVar={makeVar({
            jwt: null,
            tfaSendMethod: null,
            userName: null,
          })}
        >
          <ChakraProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <MemoryRouter initialEntries={['/domains']} initialIndex={0}>
                <DomainTagsList />
              </MemoryRouter>
            </I18nProvider>
          </ChakraProvider>
        </UserVarProvider>
      </MockedProvider>,
    )

    await waitFor(() => screen.getByText(/Add Tag/i))
    const addTagBtn = screen.getByText(/Add Tag/i)
    fireEvent.click(addTagBtn)
    await waitFor(() => screen.getAllByText(/Confirm/i))
    const confirmBtn = screen.getAllByText(/Confirm/i)[0]

    const closeBtn = screen.getAllByText(/Close/i)[0]
    fireEvent.click(closeBtn)
    expect(confirmBtn).not.toBeVisible()
  })

  it('submits create form (no-op since Formik fields are empty)', async () => {
    render(
      <MockedProvider mocks={noTagsMocks} addTypename={false}>
        <UserVarProvider
          userVar={makeVar({
            jwt: null,
            tfaSendMethod: null,
            userName: null,
          })}
        >
          <ChakraProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <MemoryRouter initialEntries={['/domains']} initialIndex={0}>
                <DomainTagsList />
              </MemoryRouter>
            </I18nProvider>
          </ChakraProvider>
        </UserVarProvider>
      </MockedProvider>,
    )

    await waitFor(() => screen.getByText(/Add Tag/i))
    const addTagBtn = screen.getByRole('button', { name: 'Add Tag' })
    fireEvent.click(addTagBtn)
    await waitFor(() => screen.getByText(/Confirm/i))
    const confirmBtn = screen.getByRole('button', { name: 'Confirm' })
    fireEvent.click(confirmBtn)

    // Just checking no crash and form still present
    await waitFor(() => screen.getByText(/Confirm/i))
  })

  it('toggles visibility icon for invisible tags', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <UserVarProvider
          userVar={makeVar({
            jwt: null,
            tfaSendMethod: null,
            userName: null,
          })}
        >
          <ChakraProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <MemoryRouter initialEntries={['/domains']} initialIndex={0}>
                <DomainTagsList />
              </MemoryRouter>
            </I18nProvider>
          </ChakraProvider>
        </UserVarProvider>
      </MockedProvider>,
    )

    await waitFor(() => screen.getByText(/ARCHIVED/i))
    const tag = screen.getByText(/ARCHIVED/i)
    const icon = within(tag.closest('div')).getByLabelText('tag-invisible') // ViewOffIcon
    expect(icon).toBeInTheDocument()
  })
})
