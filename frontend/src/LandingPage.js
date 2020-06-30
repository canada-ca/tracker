import React from 'react'
import { Trans } from '@lingui/macro'
import { Layout } from './Layout'
import { Heading, Text, Stack, Button, Divider } from '@chakra-ui/core'
import { useUserState } from './UserState'
import { SummaryGroup } from './SummaryGroup'
import { Link as RouteLink } from 'react-router-dom'

export function LandingPage() {
  const { isLoggedIn } = useUserState()
  const domainsScanned = Math.floor(Math.random() * 100 + 30)

  return (
    <Layout>
      <Stack spacing={10} shouldWrapChildren>
        <Heading as="h1">
          <Trans>Track Web Security Compliance</Trans>
        </Heading>
        <Stack spacing={4}>
          <Stack spacing={4} direction="row" flexWrap="wrap">
            <Text fontSize="lg">
              <Trans>
                Canadians rely on the Government of Canada to provide secure
                digital services. A new policy notice guides government websites
                to adopt good web security practices. Track how government sites
                are becoming more secure.
              </Trans>
            </Text>
          </Stack>
        </Stack>
        <Stack align="center">
          <SummaryGroup name="dashboard" />
          <Divider />
          <Button
            as={RouteLink}
            to="/organizations"
            variantColor="teal"
            size="lg"
          >
            <Stack align="center">
              {isLoggedIn() ? (
                <Text fontSize="lg" fontWeight="bold">
                  {domainsScanned} Domains Scanned
                </Text>
              ) : (
                <Text>Sign in to</Text>
              )}
              <Text fontSize="sm">View Summary Tables</Text>
            </Stack>
          </Button>
        </Stack>
      </Stack>
      <Divider />
      <Text>
        <Trans>
          *All data represented is mocked for demonstration purposes
        </Trans>
      </Text>
    </Layout>
  )
}
