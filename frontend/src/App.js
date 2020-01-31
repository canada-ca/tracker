import React from 'react'
import { i18n } from '@lingui/core'
import { LocaleSwitcher } from './LocaleSwitcher'
import { I18nProvider } from '@lingui/react'
import { SignatureBlock } from './SignatureBlock'
import { theme } from './theme'
import { Main } from './Main'
import { Box, Button, Heading, Grommet, Grid, ResponsiveContext } from 'grommet'

export const App = () => {
  return (
    <I18nProvider i18n={i18n}>
      <Grommet full theme={theme}>
        <ResponsiveContext.Consumer>
          {size => {
            return (
              <Grid
                fill
                rows={['auto', 'flex']}
                columns={['auto', 'flex']}
                areas={[
                  { name: 'header', start: [0, 0], end: [1, 0] },
                  { name: 'main', start: [1, 1], end: [1, 1] },
                ]}
              >
                <Box
                  gridArea="header"
                  direction="row"
                  align="center"
                  justify="between"
                  pad={{ horizontal: 'medium', vertical: 'small' }}
                  background="white"
                >
                  <Heading level="3" margin="none">
                    <Button>
                      <SignatureBlock />
                    </Button>
                  </Heading>
                  <LocaleSwitcher />
                </Box>
                <Box
                  gridArea="main"
                  justify="start"
                  pad={size}
                  margin={size}
                  align="center"
                >
                  <Main />
                </Box>
              </Grid>
            )
          }}
        </ResponsiveContext.Consumer>
      </Grommet>
    </I18nProvider>
  )
}
