import React from 'react'
import { Trans } from '@lingui/macro'
import { string } from 'prop-types'
import { Grid, Link, ListItem, Stack, Text } from '@chakra-ui/react'
import { ExternalLinkIcon } from '@chakra-ui/icons'

import { sanitizeUrl } from '../utilities/sanitizeUrl'

export function AdminDomianCard({ url, ...rest }) {
  return (
    <ListItem {...rest}>
      <Grid
        templateColumns={{ base: 'auto', md: '40% 60%' }}
        columnGap="1.5rem"
      >
        <Stack isInline>
          <Text fontWeight="bold">
            <Trans>Domain:</Trans>
          </Text>
          <Link
            ml="auto"
            // TODO: have the API enforce a scheme
            // so we don't need to guess badly here.
            href={`http://${sanitizeUrl(url)}`}
            isExternal
            target="_blank"
            rel="noopener noreferrer"
          >
            {url}
            <ExternalLinkIcon mx="2px" aria-hidden="true" />
          </Link>
        </Stack>
      </Grid>
    </ListItem>
  )
}
AdminDomianCard.propTypes = { url: string }
