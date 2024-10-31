import React from 'react'
import { theme, ChakraProvider } from '@chakra-ui/react'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { MockedProvider } from '@apollo/client/testing'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
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
    it('displays an error message on blur', async () => {
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
                <MemoryRouter initialEntries={['/forgot-password']}>
                  <ForgotPasswordPage />
                </MemoryRouter>
              </I18nProvider>
            </ChakraProvider>
          </UserVarProvider>
        </MockedProvider>,
      )

      const email = container.querySelector('input[name="email"]'); // Make sure this matches your EmailField

      await waitFor(() => {
        fireEvent.blur(email);
      });

      await waitFor(() =>
        expect(queryByText(/Email cannot be empty/i)).toBeInTheDocument(),
      );
    });
  });

  describe('when given correct input', () => {
    describe('when given correct input', () => {
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
                  <MemoryRouter initialEntries={['/forgot-password']}>
                    <Routes>
                      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                      <Route path="/" element={<div>Home Page</div>} />
                    </Routes>
                  </MemoryRouter>
                </I18nProvider>
              </ChakraProvider>
            </UserVarProvider>
          </MockedProvider>,
        );

        const email = container.querySelector('input[name="email"]');
        const submitBtn = getByText(/Submit/);

        fireEvent.change(email, { target: { value: 'user@test.ca' } });
        fireEvent.click(submitBtn);

        await waitFor(() => {
          expect(queryByText(/An email was sent with a link to reset your password/i)).toBeInTheDocument();
        });

        // Optional: check if the input still contains the submitted email
        expect(email.value).toEqual('user@test.ca'); // If not resetting the form
      });
    });
  });

});
