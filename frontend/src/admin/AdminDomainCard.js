import React from 'react'
import { Trans } from '@lingui/macro'
import { array, bool, string } from 'prop-types'
import { Flex, ListItem, Tag, TagLabel, Text } from '@chakra-ui/react'

export function AdminDomainCard({ url, tags, isHidden, assetState, isArchived, rcode, ...rest }) {
  return (
    <ListItem {...rest}>
      <Flex align="center">
        <Text minWidth="35%" fontWeight="bold" fontSize="lg" mr="2">
          {url}
        </Text>
        <Flex>
          {tags?.map((tag, idx) => {
            return (
              <Tag key={idx} mr="1" bg="gray.50" borderWidth="1px" borderColor="gray.900">
                <TagLabel textColor="primary" fontWeight="bold" mx="auto">
                  {tag}
                </TagLabel>
              </Tag>
            )
          })}
        </Flex>
        <Flex ml="auto">
          {assetState && (
            <Tag colorScheme="blue" mx="1">
              <TagLabel fontWeight="bold">{assetState}</TagLabel>
            </Tag>
          )}
          {rcode === 'NXDOMAIN' && (
            <Tag colorScheme="red" mr="auto" alignSelf="center">
              <TagLabel fontWeight="bold">NXDOMAIN</TagLabel>
            </Tag>
          )}
          {isHidden && (
            <Tag colorScheme="blue" mx="1">
              <TagLabel fontWeight="bold">
                <Trans>HIDDEN</Trans>
              </TagLabel>
            </Tag>
          )}
          {isArchived && (
            <Tag colorScheme="red" mx="1">
              <TagLabel fontWeight="bold">
                <Trans>ARCHIVED</Trans>
              </TagLabel>
            </Tag>
          )}
        </Flex>
      </Flex>
    </ListItem>
  )
}
AdminDomainCard.propTypes = {
  url: string,
  tags: array,
  isHidden: bool,
  isArchived: bool,
  rcode: string,
  assetState: string,
}
