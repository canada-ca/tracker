import React from 'react'
import {
  Box,
  Button,
  Flex,
  ListItem,
  Progress,
  Stack,
  Text,
  useBreakpointValue,
} from '@chakra-ui/react'
import { CheckCircleIcon } from '@chakra-ui/icons'
import { Link as RouteLink, useRouteMatch } from 'react-router-dom'
import { bool, number, object, string } from 'prop-types'
import { Trans } from '@lingui/macro'

export function OrganizationCard({
  name,
  acronym,
  slug,
  domainCount,
  verified,
  summaries,
  ...rest
}) {
  const { path, _url } = useRouteMatch()
  let webValue = 0
  let mailValue = 0
  const webSummary =
    summaries?.web?.categories?.filter((cat) => {
      return cat.name === 'pass'
    }) || []
  const mailSummary =
    summaries?.mail?.categories?.filter((cat) => {
      return cat.name === 'pass'
    }) || []
  if (webSummary[0]?.percentage) webValue = webSummary[0]?.percentage
  if (mailSummary[0]?.percentage) mailValue = mailSummary[0]?.percentage

  if (webValue % 1 >= 0.5) {
    webValue = Math.ceil(webValue)
  } else {
    webValue = Math.floor(webValue)
  }

  if (mailValue % 1 >= 0.5) {
    mailValue = Math.ceil(mailValue)
  } else {
    mailValue = Math.floor(mailValue)
  }

  // 'as' property does not accept responsive values, this works as a replacement
  const cardType = useBreakpointValue({ base: Flex, md: RouteLink })

  return (
    <ListItem {...rest}>
      <Flex
        width="100%"
        direction={{ base: 'column', md: 'row' }}
        alignItems={{ base: 'flex-start', md: 'center' }}
        _hover={{ md: { bg: ['', 'gray.100'] } }}
        p="4"
        as={cardType}
        to={`${path}/${slug}`}
      >
        <Box
          flexGrow={{ md: '2' }}
          flexBasis={{ md: '5em' }}
          mr={{ md: '1em' }}
          flexShrink={{ md: '0.5' }}
          minWidth={{ md: '6em' }}
        >
          <Stack isInline align="center">
            <Text
              fontSize="lg"
              fontWeight="semibold"
              textDecoration="underline"
              isTruncated
            >
              {name}
            </Text>
            <Text fontSize="lg" fontWeight="semibold">
              ({acronym})
            </Text>
            {verified && <CheckCircleIcon color="blue.500" size="icons.sm" />}
          </Stack>
        </Box>
        <Box
          flexGrow={{ md: '0' }}
          flexBasis={{ md: '7em' }}
          mr={{ md: '1em' }}
          flexShrink={{ md: '0.5' }}
          minWidth={{ md: '2em' }}
          align="center"
        >
          <Text fontWeight="semibold">
            <Trans>Services: {domainCount}</Trans>
          </Text>
        </Box>

        <Box
          mr={{ md: '1em' }}
          flexShrink={{ md: '0.5' }}
          minWidth={{ base: '100%', md: '3em' }}
          textAlign="left"
        >
          <Text fontWeight="bold">
            <Trans>Web Configuration</Trans>
          </Text>
          <Text>{webValue}%</Text>
          <Progress value={webValue} bg="gray.300" />
        </Box>

        <Box
          flexShrink={{ md: '0.5' }}
          minWidth={{ base: '100%', md: '3em' }}
          textAlign="left"
        >
          <Text fontWeight="bold">
            <Trans>Email Configuration</Trans>
          </Text>
          <Text>{mailValue}%</Text>
          <Progress value={mailValue} bg="gray.300" />
        </Box>
        {cardType?.displayName === 'Flex' && (
          <Button
            variant="primary"
            as={RouteLink}
            to={`${path}/${slug}`}
            w="100%"
            mt={2}
          >
            <Text whiteSpace="noWrap">
              <Trans>View Details</Trans>
            </Text>
          </Button>
        )}
      </Flex>
    </ListItem>
  )
}

OrganizationCard.propTypes = {
  name: string.isRequired,
  acronym: string.isRequired,
  slug: string.isRequired,
  domainCount: number.isRequired,
  verified: bool,
  summaries: object,
  domains: object,
}
