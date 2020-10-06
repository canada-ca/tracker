import React from 'react'
import { number } from 'prop-types'
import { Trans, t } from '@lingui/macro'
import { Layout } from './Layout'
import { ListOf } from './ListOf'
import { useLingui } from '@lingui/react'
import {
  Stack,
  Button,
  Box,
  Divider,
  Heading,
  Tabs,
  TabList,
  Tab,
  TabPanel,
  TabPanels,
  Input,
  InputGroup,
  InputLeftElement,
  Icon,
  Text,
} from '@chakra-ui/core'
import {
  REVERSE_PAGINATED_DOMAINS as BACKWARD,
  PAGINATED_DOMAINS as FORWARD,
} from './graphql/queries'
import { useUserState } from './UserState'
import { DomainCard } from './DomainCard'
import { usePaginatedCollection } from './usePaginatedCollection'
import { TrackerButton } from './TrackerButton'

export default function DomainsPage({ domainsPerPage = 10 }) {
  const { currentUser } = useUserState()
  const { i18n } = useLingui()

  const {
    loading,
    error,
    nodes,
    next,
    previous,
    hasNextPage,
    hasPreviousPage,
  } = usePaginatedCollection({
    fetchForward: FORWARD,
    fetchBackward: BACKWARD,
    fetchHeaders: { authorization: currentUser.jwt },
    recordsPerPage: domainsPerPage,
  })

  if (error)
    return (
      <p>
        <Trans>error {error.message}</Trans>
      </p>
    )

  if (loading)
    return (
      <p>
        <Trans>Loading...</Trans>
      </p>
    )
  console.log(nodes)
  return (
    <Layout>
      <Heading as="h1" mb="4" textAlign={['center', 'left']}>
        <Trans>Domains</Trans>
      </Heading>

      <Tabs isFitted>
        <TabList mb="4">
          <Tab>
            <Trans>Search</Trans>
          </Tab>
          <Tab>
            <Trans>Scan</Trans>
          </Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <Text fontSize="2xl" mb="2">
              <Trans>Search for any Government of Canada tracked domain:</Trans>
            </Text>
            <InputGroup width="100%" mb="8px">
              <InputLeftElement>
                <Icon name="search" color="gray.300" />
              </InputLeftElement>
              <Input type="text" placeholder={i18n._(t`Search for a domain`)} />
            </InputGroup>
            <ListOf
              elements={nodes}
              ifEmpty={() => <Trans>No Domains</Trans>}
              mb="4"
            >
              {({ id, url, slug, lastRan }, index) => (
                <Box key={`${slug}:${id}:${index}`}>
                  <DomainCard url={url} lastRan={lastRan} />
                  <Divider borderColor="gray.900" />
                </Box>
              )}
            </ListOf>
            <Stack isInline align="center" mb="4">
              <Button
                onClick={previous}
                disable={!!hasPreviousPage}
                aria-label="Previous page"
              >
                <Trans>Previous</Trans>
              </Button>

              <Button
                onClick={next}
                disable={!!hasNextPage}
                aria-label="Next page"
              >
                <Trans>Next</Trans>
              </Button>
            </Stack>
            <Trans>
              *All data represented is mocked for demonstration purposes
            </Trans>
          </TabPanel>
          <TabPanel>
            <Text fontSize="2xl" mb="2">
              <Trans>Perform a one-time scan on a domain:</Trans>
            </Text>
            <Stack flexDirection={['column', 'row']} align="center">
              <InputGroup width={['100%', '70%']} mb="8px">
                <Input type="text" placeholder={i18n._(t`Enter a domain`)} />
              </InputGroup>
              <TrackerButton
                w={['100%', '25%']}
                variant="primary"
                onClick={() => {
                  window.alert('SCAN')
                }}
              >
                <Trans>Scan Domain</Trans>
              </TrackerButton>
            </Stack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Layout>
  )
}

DomainsPage.propTypes = { domainsPerPage: number }
