import React from 'react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { MemoryRouter } from 'react-router-dom'
import { waitFor, render, cleanup } from '@testing-library/react'
import { MockedProvider } from '@apollo/react-testing'
import { UserStateProvider } from '../UserState'
import { IS_USER_ADMIN } from '../graphql/queries'
import App from '../App'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'

describe('<App/>', () => {
  afterEach(cleanup)

  describe('routes', () => {
    describe('/', () => {
      const data = [
        {
          request: {
            query: IS_USER_ADMIN,
          },
          result: {
            data: {
              user: [
                {
                  affiliations: {
                    edges: [
                      {
                        node: {
                          organization: {
                            id: 'YXBwIGFkbWluIHRlc3Q=',
                            acronym: 'ABC',
                          },
                          permission: 'ADMIN',
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        },
      ]

      it('renders the main page', async () => {
        const { getByRole } = render(
          <UserStateProvider
            initialState={{ userName: null, jwt: null, tfa: null }}
          >
            <ThemeProvider theme={theme}>
              <I18nProvider i18n={setupI18n()}>
                <MemoryRouter initialEntries={['/']} initialIndex={0}>
                  <MockedProvider mocks={data} addTypename={false}>
                    <App />
                  </MockedProvider>
                </MemoryRouter>
              </I18nProvider>
            </ThemeProvider>
          </UserStateProvider>,
        )
        await waitFor(() =>
          expect(getByRole('heading')).toHaveTextContent(/track web/i),
        )
      })
    })

    // describe('/sign-in', () => {
    //   const mocks = [
    //     {
    //       request: {
    //         query: IS_USER_ADMIN,
    //       },
    //       result: {
    //         data: {
    //           user: [
    //             {
    //               affiliations: {
    //                 edges: [
    //                   {
    //                     node: {
    //                       organization: {
    //                         id: 'YXBwIGFkbWluIHRlc3Q=',
    //                         acronym: 'ABC',
    //                       },
    //                       permission: 'ADMIN',
    //                     },
    //                   },
    //                 ],
    //               },
    //             },
    //           ],
    //         },
    //       },
    //     },
    //   ]

    //   it('renders the sign-in page', async () => {
    //     const { queryByText } = render(
    //       <UserStateProvider
    //         initialState={{ userName: null, jwt: null, tfa: null }}
    //       >
    //         <ThemeProvider theme={theme}>
    //           <I18nProvider i18n={setupI18n()}>
    //             <MemoryRouter initialEntries={['/sign-in']} initialIndex={0}>
    //               <MockedProvider mocks={mocks} addTypename={false}>
    //                 <App />
    //               </MockedProvider>
    //             </MemoryRouter>
    //           </I18nProvider>
    //         </ThemeProvider>
    //       </UserStateProvider>,
    //     )
    //     const signIn = await waitFor(() =>
    //       queryByText('Sign in', { exact: false }),
    //     )
    //     await waitFor(() => {
    //       expect(signIn).toBeInTheDocument()
    //     })
    //   })
    // })
  })
})
