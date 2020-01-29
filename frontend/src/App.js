import React, { Component } from 'react'
import { i18n } from '@lingui/core'
import { LocaleSwitcher } from './LocaleSwitcher'
import { I18nProvider } from '@lingui/react'
import { Trans, t } from '@lingui/macro'
import { Header } from './Header'
import { SignatureBlock } from './SignatureBlock'
import { Footer } from './Footer'
import { theme } from './theme'
import { LabelledMeter } from './LabelledMeter'
import canadaWordmark from './images/canada-wordmark.svg'
import {
  Main,
  Text,
  Meter,
  Stack,
  Paragraph,
  Box,
  Button,
  Collapsible,
  Heading,
  Grommet,
  Layer,
  ResponsiveContext,
  extendDefaultTheme,
} from 'grommet'

const AppBar = props => (
  <Box
    tag="header"
    direction="row"
    align="center"
    justify="between"
    background="white"
    pad={{ left: 'medium', right: 'small', vertical: 'small' }}
    border={{
      side: 'bottom',
      color: 'dark-2',
      style: 'solid',
      size: 'medium',
    }}
    style={{ zIndex: '1' }}
    {...props}
  />
)

export class App extends Component {
  render() {
    return (
      <I18nProvider i18n={i18n}>
        <Grommet theme={theme} full>
          <ResponsiveContext.Consumer>
            {size => (
              <Box fill>
                <AppBar>
                  <Heading level="3" margin="none">
                    <SignatureBlock />
                  </Heading>
                  <LocaleSwitcher />
                </AppBar>
                <Box direction="row" flex overflow={{ horizontal: 'hidden' }}>
                  <Box flex align="center" justify="center">
                    <Main pad="large">
                      <Heading>
                        <Trans>Track web security compliance</Trans>
                      </Heading>
                      <Paragraph>
                        <Trans>
                          Canadians rely on the Government of Canada to provide
                          secure digital services. A new policy notice guides
                          government websites to adopt good web security
                          practices. Track how government sites are becoming
                          more secure.
                        </Trans>
                      </Paragraph>
                      <LabelledMeter meterValue={60} />
                    </Main>
                  </Box>
                </Box>
              </Box>
            )}
          </ResponsiveContext.Consumer>
        </Grommet>
      </I18nProvider>
    )
  }
}
