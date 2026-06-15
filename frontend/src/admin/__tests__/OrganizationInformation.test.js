import React from 'react'
import { ChakraProvider, theme } from '@chakra-ui/react'
import { MemoryRouter } from 'react-router-dom'
import { act, render, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import { I18nProvider } from '@lingui/react'
import { i18n } from '@lingui/core'
import userEvent from '@testing-library/user-event'
import { makeVar } from '@apollo/client'
import { en } from 'make-plural/plurals'

import { OrganizationInformation } from '../OrganizationInformation'

import { createCache } from '../../client'
import { UserVarProvider } from '../../utilities/userState'
import { ORGANIZATION_INFORMATION } from '../../graphql/queries'
import { REMOVE_ORGANIZATION, UPDATE_ORGANIZATION } from '../../graphql/mutations'

i18n.loadLocaleData('en', { plurals: en })
i18n.load('en', { en: {} })
i18n.activate('en')

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
          externalId: 'ORG123',
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
        nameEN: 'NEW ACREN',
        nameFR: 'NEW ACRFR',
        countryEN: 'Canada',
      },
    },
    result: {
      data: {
        updateOrganization: {
          result: {
            id: 'org-id',
            acronym: 'NEW ACREN',
            name: 'Org Name',
            slug: 'org-name',
            zone: 'org zone',
            sector: 'org sector',
            country: 'Canada',
            province: 'org province',
            city: 'org city',
            verified: true,
            externalId: 'ORG123',
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
                    <OrganizationInformation orgSlug="test-org" removeOrgCallback={() => {}} />
                  </MemoryRouter>
                </I18nProvider>
              </ChakraProvider>
            </UserVarProvider>
          </MockedProvider>,
        )

        await findByText(/Org Name/)

        expect(queryByText(/org country/)).toBeInTheDocument()
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
                    <OrganizationInformation orgSlug="test-org" removeOrgCallback={() => {}} />
                  </MemoryRouter>
                </I18nProvider>
              </ChakraProvider>
            </UserVarProvider>
          </MockedProvider>,
        )

        await findByText(/Org Name/)

        expect(queryByText(/Blank fields will not be included/)).not.toBeVisible()
      })

      it('org editing error can be opened', async () => {
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
                  externalId: 'ORG123',
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

        const { getByText, findByRole, findByText, queryByText } = render(
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
                    <OrganizationInformation orgSlug="test-org" removeOrgCallback={() => {}} />
                  </MemoryRouter>
                </I18nProvider>
              </ChakraProvider>
            </UserVarProvider>
          </MockedProvider>,
        )
        await findByText(/Org Name/)

        expect(queryByText(/Blank fields will not be included/)).not.toBeVisible()

        const editOrgButton = await findByRole('button', {
          name: /Edit Organization/,
        })

        expect(editOrgButton).toBeInTheDocument()

        // open editing area
        userEvent.click(editOrgButton)

        // ensure editing area is open
        await waitFor(() => expect(getByText(/Blank fields will not be included/)).toBeVisible())
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
                  externalId: 'ORG123',
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
                    <OrganizationInformation orgSlug="test-org" removeOrgCallback={() => {}} />
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

        expect(getByText(/Are you sure you want to permanently remove the organization "Org Name"?/)).toBeVisible()

        userEvent.type(removeOrgInput, 'Org Name')

        userEvent.click(confirmOrganizationRemovalButton)

        const successfullyRemoveToastText = await findByText(/You have successfully removed Org Name/)

        await waitFor(() => expect(successfullyRemoveToastText).toBeVisible())
      })

      it('shows error when unsuccessful org removal', async () => {
        const removalErrorMocks = [
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
                  externalId: 'ORG123',
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
                    code: 400,
                    description: 'Could not remove this organization',

                    __typename: 'OrganizationError',
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
                nameEN: 'NEW ACREN',
                nameFR: 'NEWA CRFR',
                countryEN: 'Canada',
              },
            },
            result: {
              data: {
                updateOrganization: {
                  result: {
                    id: 'org-id',
                    acronym: 'NEW ACREN',
                    name: 'Org Name',
                    slug: 'org-name',
                    zone: 'org zone',
                    sector: 'org sector',
                    country: 'Canada',
                    province: 'org province',
                    city: 'org city',
                    verified: true,
                    externalId: 'ORG123',
                    __typename: 'Organization',
                  },
                },
              },
            },
          },
        ]

        const { findByRole, getByRole, findByText, getByText } = render(
          <MockedProvider mocks={removalErrorMocks} cache={createCache()}>
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
                    <OrganizationInformation orgSlug="test-org" removeOrgCallback={() => {}} />
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

        expect(getByText(/Are you sure you want to permanently remove the organization "Org Name"?/)).toBeVisible()

        userEvent.type(removeOrgInput, 'Org Name')

        userEvent.click(confirmOrganizationRemovalButton)

        const successfullyRemoveToastText = await findByText(/Could not remove this organization/)

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
                    <OrganizationInformation orgSlug="test-org" removeOrgCallback={() => {}} />
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

        expect(getByText(/Are you sure you want to permanently remove the organization "Org Name"?/)).toBeVisible()

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
                        <OrganizationInformation orgSlug="test-org" removeOrgCallback={() => {}} />
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

            await waitFor(() => expect(getByText(/Blank fields will not be included/)).toBeVisible())

            const nameENInput = await findByRole('textbox', {
              name: 'Name (EN)',
            })
            const nameFRInput = getByRole('textbox', {
              name: 'Name (FR)',
            })
            const countryENInput = getByRole('textbox', {
              name: 'Country (EN)',
            })
            const confrimOrganizationUpdateButton = getByRole('button', {
              name: 'Confirm',
            })

            userEvent.type(nameENInput, 'NEW ACREN')
            userEvent.type(nameFRInput, 'NEW ACRFR')
            userEvent.type(countryENInput, 'Canada')

            await act(() => {
              userEvent.click(confrimOrganizationUpdateButton)
            })

            const successfulUpdateToastText = await findByText(/You have successfully updated Org Name/)

            await waitFor(() => expect(successfulUpdateToastText).toBeVisible())

            // Check that the new country is shown in the info area
            const countryEl = await findByText(/Country:/)
            expect(countryEl).toHaveTextContent('Canada')
          })

          it('error from api -> display error from api', async () => {
            const updateErrorMocks = [
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
                      externalId: 'ORG123',
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
                    nameEN: 'NEW ACREN',
                    nameFR: 'NEW ACRFR',
                    countryEN: 'Canada',
                  },
                },
                result: {
                  data: {
                    updateOrganization: {
                      result: {
                        code: 400,
                        description: 'Unable to update this organization error',
                        __typename: 'OrganizationError',
                      },
                    },
                  },
                },
              },
            ]

            const { getByText, getByRole, findByRole, findByText } = render(
              <MockedProvider mocks={updateErrorMocks} cache={createCache()}>
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
                        <OrganizationInformation orgSlug="test-org" removeOrgCallback={() => {}} />
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

            await waitFor(() => expect(getByText(/Blank fields will not be included/)).toBeVisible())

            const nameENInput = await findByRole('textbox', {
              name: 'Name (EN)',
            })
            const nameFRInput = getByRole('textbox', {
              name: 'Name (FR)',
            })
            const countryENInput = getByRole('textbox', {
              name: 'Country (EN)',
            })
            const confrimOrganizationUpdateButton = getByRole('button', {
              name: 'Confirm',
            })

            userEvent.type(nameENInput, 'NEW ACREN')
            userEvent.type(nameFRInput, 'NEW ACRFR')
            userEvent.type(countryENInput, 'Canada')

            userEvent.click(confrimOrganizationUpdateButton)

            const successfulUpdateToastText = await findByText(/Unable to update this organization error/)

            await waitFor(() => expect(successfulUpdateToastText).toBeVisible())

            const countryEl = await findByText(/Country:/)
            expect(countryEl).toHaveTextContent('org country')
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
                        <OrganizationInformation orgSlug="test-org" removeOrgCallback={() => {}} />
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

            await waitFor(() => expect(getByText(/Blank fields will not be included/)).toBeVisible())

            const confrimOrganizationUpdateButton = getByRole('button', {
              name: 'Confirm',
            })

            userEvent.click(confrimOrganizationUpdateButton)

            const noValuesSuppliedToastText = await findByText(/No values were supplied/)

            await waitFor(() => expect(noValuesSuppliedToastText).toBeVisible())
          })
        })
      })
    })
  })
})
