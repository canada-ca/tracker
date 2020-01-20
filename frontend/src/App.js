/** @jsx jsx */
import { jsx, css } from '@emotion/core'
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { Trans, t } from '@lingui/macro'
import { Header } from './Header'
import { Footer } from './Footer'
import canadaWordmark from './images/canada-wordmark.svg'

export const App = () => (
  <I18nProvider i18n={i18n}>
    <section
      css={css`
				font-family: sans;
        max-width: 960px;
        padding-left: 20px;
        padding-right: 20px;
        margin: 0px auto;
      `}
    >
      <Header />
      <main
        css={css`
          max-width: 960px;
          margin: 0 auto;
          padding-left: 20px;
          padding-right: 20px;
          padding: 0 20px;
          padding-bottom: calc(80px + 60px);
        `}
      >
        <Trans>Hello from React</Trans>
      </main>
    </section>
    <Footer>
      <img
        css={css`
          height: 25px;
        `}
        height="100%"
        src={canadaWordmark}
      />
    </Footer>
  </I18nProvider>
)
