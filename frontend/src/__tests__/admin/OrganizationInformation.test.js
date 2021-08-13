import React from 'react'
import { ChakraProvider, theme } from '@chakra-ui/react'
import { MemoryRouter } from 'react-router-dom'
import { render, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import userEvent from '@testing-library/user-event'
import { makeVar } from '@apollo/client'
import { en } from 'make-plural/plurals'

import { OrganizationInformation } from '../../admin/OrganizationInformation'
import { createCache } from '../../client'
import { UserVarProvider } from '../../utilities/userState'
import { ORGANIZATION_INFORMATION } from '../../graphql/queries'
import {
  REMOVE_ORGANIZATION,
  UPDATE_ORGANIZATION,
} from '../../graphql/mutations'

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
      query: ORGANIZATION_INFORMATION,
      variables: { orgSlug: 'test-org' },
    },
    result: {
      data: {
        findOrganizationBySlug: {
          id: 'org-id',
          acronym: 'ORG-ACR',
          name: 'Org Name',
          slug: 'org-name',
          zone: 'org zone',
          sector: 'org sector',
          country: 'org country',
          province: 'org province',
          city: 'org city',
          verified: true,
          __typename: 'Organization',
        },
      },
    },
  },
  {
    request: {
      query: REMOVE_ORGANIZATION,
      variables: { orgId: 'org-id' },
    },
    result: {
      data: {
        removeOrganization: {
          result: {
            status: 'Organization successfully removed.',
            organization: {
              id: 'org-id',
              name: 'Org Name',
              __typename: 'Organization',
            },
            __typename: 'OrganizationResult',
          },
        },
      },
    },
  },
  {
    request: {
      query: UPDATE_ORGANIZATION,
      variables: {
        id: 'org-id',
        acronymEN: 'NEWACREN',
        acronymFR: 'NEWACRFR',
        countryEN: 'Canada',
      },
    },
    result: {
      data: {
        updateOrganization: {
          result: {
            id: 'org-id',
            acronym: 'NEWACREN',
            name: 'Org Name',
            slug: 'org-name',
            zone: 'org zone',
            sector: 'org sector',
            country: 'Canada',
            province: 'org province',
            city: 'org city',
            verified: true,
            __typename: 'Organization',
          },
        },
      },
    },
  },
]

describe('<OrganizationInformation />', () => {
  describe('given a valid organization slug', () => {
    describe('the organization has the required fields', () => {
      it('displays the organization information', async () => {
        const { queryByText, findByText } = render(
          <MockedProvider mocks={mocks} cache={createCache()}>
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
                    <OrganizationInformation
                      orgSlug="test-org"
                      removeOrgCallback={() => {}}
                    />
                  </MemoryRouter>
                </I18nProvider>
              </ChakraProvider>
            </UserVarProvider>
          </MockedProvider>,
        )

        await findByText(/Org Name/)

        expect(queryByText(/org sector/)).toBeInTheDocument()
      })

      it('organization editing area is hidden', async () => {
        const { queryByText, findByText } = render(
          <MockedProvider mocks={mocks} cache={createCache()}>
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
                    <OrganizationInformation
                      orgSlug="test-org"
                      removeOrgCallback={() => {}}
                    />
                  </MemoryRouter>
                </I18nProvider>
              </ChakraProvider>
            </UserVarProvider>
          </MockedProvider>,
        )

        await findByText(/Org Name/)

        expect(
          queryByText(/Blank fields will not be included/),
        ).not.toBeVisible()
      })

      it('can remove the organization', async () => {
        const mocks = [
          {
            request: {
              query: ORGANIZATION_INFORMATION,
              variables: { orgSlug: 'test-org' },
            },
            result: {
              data: {
                findOrganizationBySlug: {
                  id: 'org-id',
                  acronym: 'ORG-ACR',
                  name: 'Org Name',
                  slug: 'org-name',
                  zone: 'org zone',
                  sector: 'org sector',
                  country: 'org country',
                  province: 'org province',
                  city: 'org city',
                  verified: true,
                  __typename: 'Organization',
                },
              },
            },
          },
          {
            request: {
              query: REMOVE_ORGANIZATION,
              variables: { orgId: 'org-id' },
            },
            result: {
              data: {
                removeOrganization: {
                  result: {
                    status: 'Organization successfully removed.',
                    organization: {
                      id: 'org-id',
                      name: 'Org Name',
                      __typename: 'Organization',
                    },
                    __typename: 'OrganizationResult',
                  },
                },
              },
            },
          },
        ]

        const { getByText, getByRole, findByRole, findByText } = render(
          <MockedProvider mocks={mocks} cache={createCache()}>
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
                    <OrganizationInformation
                      orgSlug="test-org"
                      removeOrgCallback={() => {}}
                    />
                  </MemoryRouter>
                </I18nProvider>
              </ChakraProvider>
            </UserVarProvider>
          </MockedProvider>,
        )

        const removeOrgButton = await findByRole('button', {
          name: /Remove Organization/,
        })

        expect(removeOrgButton).toBeInTheDocument()

        userEvent.click(removeOrgButton)

        const removeOrgInput = getByRole('textbox', {
          name: 'Organization Name',
          hidden: false,
        })
        const confirmOrganizationRemovalButton = getByRole('button', {
          name: 'Confirm',
        })

        await waitFor(() => expect(removeOrgInput).toBeVisible())

        expect(
          getByText(
            /Are you sure you want to permanently remove the organization "Org Name"?/,
          ),
        ).toBeVisible()

        userEvent.type(removeOrgInput, 'Org Name')

        userEvent.click(confirmOrganizationRemovalButton)

        const successfullyRemoveToastText = await findByText(
          /You have successfully removed Org Name/,
        )

        await waitFor(() => expect(successfullyRemoveToastText).toBeVisible())
      })

      it('blocks the user from removing until entering the org name', async () => {
        const { getByText, getByRole, findByRole } = render(
          <MockedProvider mocks={mocks} cache={createCache()}>
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
                    <OrganizationInformation
                      orgSlug="test-org"
                      removeOrgCallback={() => {}}
                    />
                  </MemoryRouter>
                </I18nProvider>
              </ChakraProvider>
            </UserVarProvider>
          </MockedProvider>,
        )

        const removeOrgButton = await findByRole('button', {
          name: /Remove Organization/,
        })

        expect(removeOrgButton).toBeInTheDocument()

        userEvent.click(removeOrgButton)

        const removeOrgInput = getByRole('textbox', {
          name: 'Organization Name',
        })
        const confirmOrganizationRemovalButton = getByRole('button', {
          name: 'Confirm',
        })

        await waitFor(() => expect(removeOrgInput).toBeVisible())

        expect(
          getByText(
            /Are you sure you want to permanently remove the organization "Org Name"?/,
          ),
        ).toBeVisible()

        userEvent.click(confirmOrganizationRemovalButton)

        await waitFor(() => expect(removeOrgInput).toBeInvalid())
      })

      describe('user tries to update organization', () => {
        describe('some update fields are filled out', () => {
          it('updates the organization', async () => {
            const { getByText, getByRole, findByRole, findByText } = render(
              <MockedProvider mocks={mocks} cache={createCache()}>
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
                        <OrganizationInformation
                          orgSlug="test-org"
                          removeOrgCallback={() => {}}
                        />
                      </MemoryRouter>
                    </I18nProvider>
                  </ChakraProvider>
                </UserVarProvider>
              </MockedProvider>,
            )

            const editOrgButton = await findByRole('button', {
              name: /Edit Organization/,
            })

            expect(editOrgButton).toBeInTheDocument()

            userEvent.click(editOrgButton)

            await waitFor(() =>
              expect(
                getByText(/Blank fields will not be included/),
              ).toBeVisible(),
            )

            const acronymENInput = await findByRole('textbox', {
              name: 'Acronym (EN)',
            })
            const acronymFRInput = getByRole('textbox', {
              name: 'Acronym (FR)',
            })
            const countryENInput = getByRole('textbox', {
              name: 'Country (EN)',
            })
            const confrimOrganizationUpdateButton = getByRole('button', {
              name: 'Confirm',
            })

            userEvent.type(acronymENInput, 'NEWACREN')
            userEvent.type(acronymFRInput, 'NEWACRFR')
            userEvent.type(countryENInput, 'Canada')

            userEvent.click(confrimOrganizationUpdateButton)

            const successfulUpdateToastText = await findByText(
              /You have successfully updated Org Name/,
            )

            await waitFor(() => expect(successfulUpdateToastText).toBeVisible())

            // Check that the new country is shown in the info area
            const countryEl = await findByText(/Country:/)
            expect(countryEl).toHaveTextContent('Canada')
          })
        })

        describe('no update fields are filled out', () => {
          it('shows user error toast', async () => {
            const { getByText, getByRole, findByRole, findByText } = render(
              <MockedProvider mocks={mocks} cache={createCache()}>
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
                        <OrganizationInformation
                          orgSlug="test-org"
                          removeOrgCallback={() => {}}
                        />
                      </MemoryRouter>
                    </I18nProvider>
                  </ChakraProvider>
                </UserVarProvider>
              </MockedProvider>,
            )

            const editOrgButton = await findByRole('button', {
              name: /Edit Organization/,
            })

            expect(editOrgButton).toBeInTheDocument()

            userEvent.click(editOrgButton)

            await waitFor(() =>
              expect(
                getByText(/Blank fields will not be included/),
              ).toBeVisible(),
            )

            const confrimOrganizationUpdateButton = getByRole('button', {
              name: 'Confirm',
            })

            userEvent.click(confrimOrganizationUpdateButton)

            const noValuesSuppliedToastText = await findByText(
              /No values were supplied/,
            )

            await waitFor(() => expect(noValuesSuppliedToastText).toBeVisible())
          })
        })
      })
    })
  })
})
