import React from 'react'
import {
  Box,
  Flex,
  Grid,
  Heading,
  Icon,
  Stack,
  Text,
  useToast,
} from '@chakra-ui/core'
import { string } from 'prop-types'
import { useQuery } from '@apollo/client'
import { ORGANIZATION_INFORMATION } from './graphql/queries'
import { useUserState } from './UserState'
import { LoadingMessage } from './LoadingMessage'
import { Trans } from '@lingui/macro'
import { ErrorFallbackMessage } from './ErrorFallbackMessage'
import { TrackerButton } from './TrackerButton'

export default function OrganizationInformation({ orgSlug, ...props }) {
  const { currentUser } = useUserState()
  const toast = useToast()

  const { loading, error, data } = useQuery(ORGANIZATION_INFORMATION, {
    context: {
      headers: {
        authorization: currentUser.jwt,
      },
    },
    variables: {
      orgSlug,
    },
    onError: (error) => {
      const [_, message] = error.message.split(': ')
      toast({
        title: 'Error',
        description: message,
        status: 'error',
        duration: 9000,
        isClosable: true,
        position: 'top-left',
      })
    },
  })

  if (loading) {
    return (
      <LoadingMessage>
        <Trans>Organization Information</Trans>
      </LoadingMessage>
    )
  }

  if (error) {
    return <ErrorFallbackMessage error={error} />
  }

  const org = data.findOrganizationBySlug

  return (
    <Box {...props}>
      <Stack isInline align="center" mb="1em" flexWrap="wrap">
        <Stack
          isInline
          align="center"
          flexGrow={1}
          flexShrink={0}
          flexBasis={{ base: '100%', md: 'auto' }}
          mb={{ base: '0.5em', md: '0' }}
        >
          <Heading as="h1" fontSize="3xl">
            {org.name}
          </Heading>
          <Icon name="check-circle" color="blue.500" size="icons.md" />
        </Stack>

        <Stack
          flexGrow={{ base: '1', md: '0' }}
          isInline
          justifyContent="space-evenly"
        >
          <TrackerButton
            onClick={() => {}}
            variant="danger"
            px="2"
            mr={{ md: '0.5em' }}
            w={{ base: '45%', md: 'auto' }}
          >
            <Icon name="minus" />
          </TrackerButton>
          <TrackerButton
            variant="primary"
            px="2"
            onClick={() => {}}
            w={{ base: '45%', md: 'auto' }}
          >
            <Icon name="edit" />
          </TrackerButton>
        </Stack>
      </Stack>

      <Grid
        gridTemplateColumns={{ base: '1fr', md: '1fr 1fr' }}
        gridRowGap="0.5em"
        mx="1rem"
      >
        <Text fontWeight="bold">
          Slug:{' '}
          <Box as="span" fontWeight="normal">
            {org.slug}
          </Box>
        </Text>
        <Text fontWeight="bold">
          Acronym:{' '}
          <Box as="span" fontWeight="normal">
            {org.acronym}
          </Box>
        </Text>

        <Text fontWeight="bold">
          Zone:{' '}
          <Box as="span" fontWeight="normal">
            {org.zone}
          </Box>
        </Text>
        <Text fontWeight="bold">
          Sector:{' '}
          <Box as="span" fontWeight="normal">
            {org.sector}
          </Box>
        </Text>

        <Text fontWeight="bold">
          City:{' '}
          <Box as="span" fontWeight="normal">
            {org.city}
          </Box>
        </Text>
        <Text fontWeight="bold">
          Province:{' '}
          <Box as="span" fontWeight="normal">
            {org.province}
          </Box>
        </Text>

        <Text fontWeight="bold">
          Country:{' '}
          <Box as="span" fontWeight="normal">
            {org.country}
          </Box>
        </Text>
      </Grid>
    </Box>

    // <Flex flexDirection="column">
    //   <Stack isInline align="center" flexShrink={0} flexBasis="100%">
    //     <Heading as="h1" fontSize="3xl">
    //       Header{org.name}
    //     </Heading>
    //     <Icon name="check-circle" color="blue.500" size="icons.md" />
    //   </Stack>
    //   <Text fontWeight="bold">
    //     Slug:{' '}
    //     <Box as="span" fontWeight="normal">
    //       {org.slug}
    //     </Box>
    //   </Text>
    //   <Text fontWeight="bold">
    //     Acronym:{' '}
    //     <Box as="span" fontWeight="normal">
    //       {org.acronym}
    //     </Box>
    //   </Text>
    //   <Text fontWeight="bold">
    //     Zone:{' '}
    //     <Box as="span" fontWeight="normal">
    //       {org.zone}
    //     </Box>
    //   </Text>
    //   <Text fontWeight="bold">
    //     Sector:{' '}
    //     <Box as="span" fontWeight="normal">
    //       {org.sector}
    //     </Box>
    //   </Text>
    //   <Text fontWeight="bold">
    //     City:{' '}
    //     <Box as="span" fontWeight="normal">
    //       {org.city}
    //     </Box>
    //   </Text>
    //   <Text fontWeight="bold">
    //     Province:{' '}
    //     <Box as="span" fontWeight="normal">
    //       {org.province}
    //     </Box>
    //   </Text>
    //   <Text fontWeight="bold">
    //     Country:{' '}
    //     <Box as="span" fontWeight="normal">
    //       {org.country}
    //     </Box>
    //   </Text>
    // </Flex>
  )
}

OrganizationInformation.propTypes = {
  orgSlug: string.isRequired,
}
