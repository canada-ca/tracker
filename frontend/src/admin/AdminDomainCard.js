import React from 'react'
import { Trans } from '@lingui/macro'
import { array, bool, string } from 'prop-types'
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
import { ABTestingWrapper } from '../app/ABTestWrapper'
import { ABTestVariant } from '../app/ABTestVariant'

export function AdminDomainCard({
  url,
  tags,
  isHidden,
  isArchived,
  isVendor,
  ...rest
}) {
  return (
    <ListItem {...rest}>
      <Grid
        templateColumns={{ base: 'auto', md: '40% 60%' }}
        columnGap="1.5rem"
      >
        <Stack isInline align="center">
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
        <ABTestingWrapper insiderVariantName="B">
          <ABTestVariant name="B">
            <Flex>
              {tags?.map((tag, idx) => {
                return (
                  <Tag
                    key={idx}
                    m="1"
                    borderRadius="full"
                    borderWidth="1px"
                    borderColor="gray.900"
                  >
                    <TagLabel mx="auto">{tag}</TagLabel>
                  </Tag>
                )
              })}
              {isVendor && (
                <Tag
                  m="1"
                  borderRadius="full"
                  borderWidth="1px"
                  borderColor="gray.900"
                >
                  <TagLabel mx="auto">
                    <Trans>Vendor</Trans>
                  </TagLabel>
                </Tag>
              )}
              {isHidden && (
                <Tag
                  m="1"
                  borderRadius="full"
                  borderWidth="1px"
                  borderColor="gray.900"
                >
                  <TagLabel mx="auto">
                    <Trans>Hidden</Trans>
                  </TagLabel>
                </Tag>
              )}
              {isArchived && (
                <Tag
                  m="1"
                  borderRadius="full"
                  borderWidth="1px"
                  borderColor="gray.900"
                >
                  <TagLabel mx="auto">
                    <Trans>Archived</Trans>
                  </TagLabel>
                </Tag>
              )}
            </Flex>
          </ABTestVariant>
        </ABTestingWrapper>
      </Grid>
    </ListItem>
  )
}
AdminDomainCard.propTypes = {
  url: string,
  tags: array,
  isHidden: bool,
  isArchived: bool,
  isVendor: bool,
}
