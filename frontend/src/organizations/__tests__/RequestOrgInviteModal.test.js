import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { theme, ChakraProvider, useDisclosure } from '@chakra-ui/react'
import { I18nProvider } from '@lingui/react'
import { MockedProvider } from '@apollo/client/testing'
import { setupI18n } from '@lingui/core'
import { en } from 'make-plural/plurals'
import userEvent from '@testing-library/user-event'
import { RequestOrgInviteModal } from '../RequestOrgInviteModal'
import { REQUEST_INVITE_TO_ORG } from '../../graphql/mutations'
import { matchMediaSize } from '../../helpers/matchMedia'
import { createCache } from '../../client'
import { makeVar } from '@apollo/client'
import { UserVarProvider } from '../../utilities/userState'

matchMediaSize()

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: { plurals: en },
  },
})

const orgId = 'test-id'
const orgName = 'test-org-name'

const RequestModal = () => {
  const { isOpen, onOpen, onClose } = useDisclosure()

  return (
    <>
      <button onClick={onOpen}>Open Modal</button>
      <RequestOrgInviteModal isOpen={isOpen} onClose={onClose} orgId={orgId} orgName={orgName} />
    </>
  )
}

describe('<RequestOrgInviteModal />', () => {
  it("successfully renders modal when 'Open Modal' btn is clicked", async () => {
    const { queryByText, getByRole } = render(
      <MockedProvider>
        <UserVarProvider userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}>
          <MemoryRouter initialEntries={['/']}>
            <ChakraProvider theme={theme}>
              <I18nProvider i18n={i18n}>
                <RequestModal />
              </I18nProvider>
            </ChakraProvider>
          </MemoryRouter>
        </UserVarProvider>
      </MockedProvider>,
    )

    // modal closed
    const openModalButton = getByRole('button', { name: /Open Modal/ })
    expect(queryByText(/test-org-name/)).not.toBeInTheDocument()

    // modal opened
    userEvent.click(openModalButton)

    await waitFor(() => {
      expect(queryByText(/test-org-name/)).toBeVisible()
    })
    const closeModalButton = getByRole('button', { name: /Close/ })

    // modal closed
    userEvent.click(closeModalButton)

    await waitFor(() => expect(queryByText(/test-org-name/)).not.toBeInTheDocument())
  })

  describe('when confirm btn is clicked', () => {
    it('successfully requests invite', async () => {
      const mocks = [
        {
          request: {
            query: REQUEST_INVITE_TO_ORG,
            variables: {
              orgId: orgId,
            },
          },
          result: {
            data: {
              requestOrgAffiliation: {
                result: {
                  status: 'Hello World',
                  __typename: 'InviteUserToOrgResult',
                },
              },
            },
          },
        },
      ]
      const { queryByText, getByRole } = render(
        <MockedProvider mocks={mocks} cache={createCache()}>
          <UserVarProvider userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}>
            <MemoryRouter initialEntries={['/']}>
              <ChakraProvider theme={theme}>
                <I18nProvider i18n={i18n}>
                  <RequestModal />
                </I18nProvider>
              </ChakraProvider>
            </MemoryRouter>
          </UserVarProvider>
        </MockedProvider>,
      )

      // modal closed
      const openModalButton = getByRole('button', { name: /Open Modal/ })
      expect(queryByText(/test-org-name/)).not.toBeInTheDocument()

      // modal opened
      userEvent.click(openModalButton)

      await waitFor(() => {
        expect(queryByText(/test-org-name/)).toBeVisible()
      })
      const confirmButton = getByRole('button', { name: /Confirm/ })

      // modal closed
      userEvent.click(confirmButton)

      await waitFor(() =>
        expect(queryByText(/Your request has been sent to the organization administrators./)).toBeInTheDocument(),
      )
    })
    describe('fails to request invite', () => {
      it('a server-side error occurs', async () => {
        const mocks = [
          {
            request: {
              query: REQUEST_INVITE_TO_ORG,
              variables: {
                orgId: orgId,
              },
            },
            result: {
              error: { errors: [{ message: 'error' }] },
            },
          },
        ]
        const { queryByText, getByRole } = render(
          <MockedProvider mocks={mocks} cache={createCache()}>
            <UserVarProvider userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}>
              <MemoryRouter initialEntries={['/']}>
                <ChakraProvider theme={theme}>
                  <I18nProvider i18n={i18n}>
                    <RequestModal />
                  </I18nProvider>
                </ChakraProvider>
              </MemoryRouter>
            </UserVarProvider>
          </MockedProvider>,
        )

        // modal closed
        const openModalButton = getByRole('button', { name: /Open Modal/ })
        expect(queryByText(/test-org-name/)).not.toBeInTheDocument()

        // modal opened
        userEvent.click(openModalButton)

        await waitFor(() => {
          expect(queryByText(/test-org-name/)).toBeVisible()
        })
        const confirmButton = getByRole('button', { name: /Confirm/ })

        // modal closed
        userEvent.click(confirmButton)

        await waitFor(() => expect(queryByText(/Unable to request invite, please try again./)).toBeInTheDocument())
      })
      it('a client-side error occurs', async () => {
        const mocks = [
          {
            request: {
              query: REQUEST_INVITE_TO_ORG,
              variables: {
                orgId: orgId,
              },
            },
            result: {
              data: {
                requestOrgAffiliation: {
                  result: {
                    code: 92,
                    description: 'Hello World',
                    __typename: 'AffiliationError',
                  },
                },
                __typename: 'RequestOrgAffiliationPayload',
              },
            },
          },
        ]
        const { queryByText, getByRole } = render(
          <MockedProvider mocks={mocks} cache={createCache()}>
            <UserVarProvider userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}>
              <MemoryRouter initialEntries={['/']}>
                <ChakraProvider theme={theme}>
                  <I18nProvider i18n={i18n}>
                    <RequestModal />
                  </I18nProvider>
                </ChakraProvider>
              </MemoryRouter>
            </UserVarProvider>
          </MockedProvider>,
        )

        // modal closed
        const openModalButton = getByRole('button', { name: /Open Modal/ })
        expect(queryByText(/test-org-name/)).not.toBeInTheDocument()

        // modal opened
        userEvent.click(openModalButton)

        await waitFor(() => {
          expect(queryByText(/test-org-name/)).toBeVisible()
        })
        const confirmButton = getByRole('button', { name: /Confirm/ })

        // modal closed
        userEvent.click(confirmButton)

        await waitFor(() => expect(queryByText(/Unable to request invite, please try again./)).toBeInTheDocument())
      })
    })
  })
})
