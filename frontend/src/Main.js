import React from 'react'
import { Trans, t } from '@lingui/macro'
import ReactDOM from 'react-dom'
import { LabelledMeter } from './LabelledMeter'
import {
  Box,
  Grid,
  Paragraph,
  ResponsiveContext,
  Heading,
  Grommet,
} from 'grommet'
import { theme } from './theme'
// columns, rows and areas are for Grid with a known number of contents / boxes.

// if size if small, we only 1 column
// if size if medium, we only 2 column
// if size if large or xlarge, we 3 three columns
const columns = {
  xsmall: ['auto'],
  small: ['auto'],
  medium: ['auto', 'auto'],
  large: ['auto', 'auto'],
  xlarge: ['auto', 'auto'],
}

// if size if small, we have 3 rows
// if size if medium, we have 2 rows
// if size if large or xlarge, we have 1 row
const rows = {
  xsmall: ['xsmall', 'xsmall', 'xsmall'],
  small: ['xsmall', 'xsmall', 'xsmall'],
  medium: ['xsmall', 'xsmall'],
  large: ['xsmall', 'xsmall'],
  xlarge: ['xsmall', 'xsmall'],
}

// set the different areas you need for every size
const areas = {
  small: [
    { name: 'header', start: [0, 0], end: [0, 0] },
    { name: 'description', start: [0, 1], end: [0, 1] },
    { name: 'stats', start: [0, 2], end: [0, 2] },
  ],
  medium: [
    { name: 'header', start: [0, 0], end: [1, 0] },
    { name: 'description', start: [0, 1], end: [0, 1] },
    { name: 'stats', start: [1, 1], end: [1, 1] },
  ],
  large: [
    { name: 'header', start: [0, 0], end: [1, 0] },
    { name: 'description', start: [0, 1], end: [0, 1] },
    { name: 'stats', start: [1, 1], end: [1, 1] },
  ],
  xlarge: [
    { name: 'header', start: [0, 0], end: [1, 0] },
    { name: 'description', start: [0, 1], end: [0, 1] },
    { name: 'stats', start: [1, 1], end: [1, 1] },
  ],
}

const ResponsiveGrid = ({
  children,
  overrideColumns,
  overrideRows,
  areas,
  ...props
}) => (
  <ResponsiveContext.Consumer>
    {size => {
      // take into consideration if not array is sent but a simple string
      let columnsVal = columns
      if (columns) {
        if (columns[size]) {
          columnsVal = columns[size]
        }
      }

      let rowsVal = rows
      if (rows) {
        if (rows[size]) {
          rowsVal = rows[size]
        }
      }

      // also if areas is a simple array not an object of arrays for different sizes
      let areasVal = areas
      if (areas && !Array.isArray(areas)) areasVal = areas[size]

      return (
        <Grid
          {...props}
          areas={!areasVal ? undefined : areasVal}
          rows={!rowsVal ? size : rowsVal}
          columns={!columnsVal ? size : columnsVal}
        >
          {children}
        </Grid>
      )
    }}
  </ResponsiveContext.Consumer>
)

// this is an example for a responsive Grid.
// with this example, you can either have a fixed Grid (with a known number content)
// or generic one (with unkown number of contents like a list that renders)
export function Main() {
  return (
    <Grommet theme={theme}>
      <Box>
        <ResponsiveGrid
          rows={rows}
          columns={columns}
          gap="small"
          areas={areas}
          margin="medium"
        >
          <Box gridArea="header" justify="center" align="center">
            <Heading>
              <Trans>Track web security compliance</Trans>
            </Heading>
          </Box>
          <Box gridArea="description" justify="center" align="center">
            <Paragraph>
              <Trans>
                Canadians rely on the Government of Canada to provide secure
                digital services. A new policy notice guides government websites
                to adopt good web security practices. Track how government sites
                are becoming more secure.
              </Trans>
            </Paragraph>
          </Box>
          <Box gridArea="stats" justify="center" align="center">
            <LabelledMeter meterValue={60} />
          </Box>
        </ResponsiveGrid>
      </Box>
    </Grommet>
  )
}
