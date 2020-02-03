import React from 'react'
import { arrayOf, node } from 'prop-types'
import { LocaleSwitcher } from './LocaleSwitcher'
import { SignatureBlock } from './SignatureBlock'
import { Box, Button, Header, Grid, ResponsiveContext } from 'grommet'

export const Layout = ({ children }) => (
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
            <Header margin="none">
              <Button>
                <SignatureBlock />
              </Button>
            </Header>
            <LocaleSwitcher />
          </Box>
          <Box
            gridArea="main"
            justify="start"
            pad={size}
            margin={size}
            align="center"
          >
            {children}
          </Box>
        </Grid>
      )
    }}
  </ResponsiveContext.Consumer>
)

Layout.propTypes = {
  children: node,
}
