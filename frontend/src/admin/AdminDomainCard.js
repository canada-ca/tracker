import React from 'react'
import { Trans } from '@lingui/macro'
import { array, string } from 'prop-types'
import {
  Flex,
  Grid,
  Link,
  ListItem,
  Stack,
  Tag,
  TagLabel,
  Text,
} from '@chakra-ui/react'
import { ExternalLinkIcon } from '@chakra-ui/icons'

import { sanitizeUrl } from '../utilities/sanitizeUrl'

export function AdminDomainCard({ url, tags, ...rest }) {
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
        <Flex>
          {tags?.map(({ label }, idx) => {
            return (
              <Tag key={idx} m="2">
                <TagLabel>{label}</TagLabel>
              </Tag>
            )
          })}
        </Flex>
      </Grid>
    </ListItem>
  )
}
AdminDomainCard.propTypes = { url: string, tags: array }
