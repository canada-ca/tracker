import React from 'react'
import { theme, ChakraProvider } from '@chakra-ui/react'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { MockedProvider } from '@apollo/client/testing'
// import { createMemoryHistory } from 'history'
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { makeVar } from '@apollo/client'
import { en } from 'make-plural/plurals'

import ForgotPasswordPage from '../../auth/ForgotPasswordPage'

import { UserVarProvider } from '../../utilities/userState'
import { SEND_PASSWORD_RESET_LINK } from '../../graphql/mutations'

const mocks = [
  {
    request: {
      query: SEND_PASSWORD_RESET_LINK,
      variables: { userName: 'user@test.ca' },
    },
    result: {
      data: {
        sendPasswordResetLink: {
          status: 'Hello World',
          __typename: 'SendPasswordResetLinkPayload',
        },
      },
    },
  },
]

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: { plurals: en },
  },
})

describe('<ForgotPasswordPage />', () => {
  describe('given no input', () => {
    describe('when onBlur fires', () => {
      describe('email field', () => {
        it('displays an error message', async () => {
          const { container, queryByText } = render(
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
                    <MemoryRouter
                      initialEntries={['/forgot-password']}
                      initialIndex={0}
                    >
                      <ForgotPasswordPage />
                    </MemoryRouter>
                  </I18nProvider>
                </ChakraProvider>
              </UserVarProvider>
            </MockedProvider>,
          )

          const email = container.querySelector('#email')

          await waitFor(() => {
            fireEvent.blur(email)
          })

          await waitFor(() =>
            expect(queryByText(/Email cannot be empty/i)).toBeInTheDocument(),
          )
        })
      })
    })
  })

  // describe('when given correct input', () => {
  //   const history = createMemoryHistory({
  //     initialEntries: ['/forgot-password'],
  //     initialIndex: 0,
  //   })
  describe('when given correct input', () => {
    render(
      <MemoryRouter initialEntries={['/forgot-password']}>
        <Routes>
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Routes>
      </MemoryRouter>
    );

    it('successfully submits', async () => {
      const { container, queryByText, getByText } = render(
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
                <MemoryRouter initialEntries={['/forgot-password']} initialIndex={0}>
                  <Routes>
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/" element={<HomePage />} /> {/* Assuming redirection to Home */}
                  </Routes>
                </MemoryRouter>
              </I18nProvider>
            </ChakraProvider>
          </UserVarProvider>
        </MockedProvider>,
      );
    
      const email = container.querySelector('#email');
      const submitBtn = getByText(/Submit/);
      
      fireEvent.change(email, { target: { value: 'user@test.ca' } });
      fireEvent.click(submitBtn);
    
      await waitFor(() => {
        expect(
          queryByText(/An email was sent with a link to reset your password/i),
        ).toBeInTheDocument();
      });
    
      await waitFor(() => {
        expect(container.querySelector('input').value).toEqual('');
      });
    });
    
  })
})
//edited
