import React from 'react'
import { t, Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Layout } from './Layout'
import { Heading, Text, Stack } from '@chakra-ui/core'
import { SummaryGroup } from './SummaryGroup'

export function LandingPage() {
  const { i18n } = useLingui()

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
          <SummaryGroup
            name="dashboard"
            title={i18n._(t`Dashboard Overview`)}
            description={i18n._(
              t`Web and email security configuration of all domains`,
            )}
          />
          <SummaryGroup
            name="web"
            title={i18n._(t`Web Security Overview`)}
            description={i18n._(
              t`Key aspects of web application security of the hosts monitored by this dashboard.`,
            )}
          />
          <SummaryGroup
            name="email"
            title={i18n._(t`Email Security Overview`)}
            description={i18n._(
              t`Key aspects of email security of the hosts monitored by this dashboard.`,
            )}
          />
        </Stack>
      </Stack>
      <Text>
        *All data represented in charts is mocked for demonstration purposes
      </Text>
    </Layout>
  )
}
