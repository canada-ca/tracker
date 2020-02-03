import React from 'react'
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { theme } from './theme'
import { Main } from './Main'
import { Layout } from './Layout'
import { Grommet } from 'grommet'
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'

export const App = () => {
  return (
    <I18nProvider i18n={i18n}>
      <Grommet full theme={theme}>
        <Layout>
          <Router>
            <Switch>
              <Route path="/">
                <Main />
              </Route>
            </Switch>
          </Router>
        </Layout>
      </Grommet>
    </I18nProvider>
  )
}
