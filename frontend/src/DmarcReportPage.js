import React from 'react'
import {
  Heading,
  Box,
  Text,
  Stack,
  SimpleGrid,
  Icon,
  Flex,
  Button,
} from '@chakra-ui/core'

import { useUserState } from './UserState'
import { DkimEntry } from './DkimEntry'
import { SpfEntry } from './SpfEntry'

import { useQuery } from '@apollo/react-hooks'
import { QUERY_DMARC_REPORT } from './graphql/queries'
import { DmarcReportGraph } from './DmarcReportGraph'

export function DmarcReportPage() {
  const { currentUser } = useUserState()
  const { loading, error, data } = useQuery(QUERY_DMARC_REPORT, {
    variables: { reportId: 'test-report-id' },
    context: {
      headers: {
        authorization: currentUser.jwt,
      },
    },
  })

  if (loading) return <p>Loading...</p>
  if (error) return <p>{String(error)}</p>
  return (
    <Box>
      <Heading mb={4}>DMARC Report</Heading>
      <Text mb={10}>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
        veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
        commodo consequat.
      </Text>
      <SimpleGrid
        columns={{ sm: 1, md: 1, lg: 2, xl: 2 }}
        spacing="50px"
        spacingY="100px"
        mb="105px"
      >
        <Stack>
          <Flex align="center" role="dmarcHeader">
            <Text fontSize="2xl" fontWeight="bold">
              DMARC
            </Text>
            {data.queryDmarcReport.dmarcResult ? (
              <Icon
                ml={2}
                name="check-circle"
                size="26px"
                color="green.500"
                role="passIcon"
              />
            ) : (
              <Icon
                ml={2}
                name="warning"
                size="26px"
                color="red.500"
                role="failIcon"
              />
            )}
          </Flex>

          <DmarcReportGraph
            passDmarcPercentage={data.queryDmarcReport.passDmarcPercentage}
            passArcPercentage={data.queryDmarcReport.passArcPercentage}
            failDmarcPercentage={data.queryDmarcReport.failDmarcPercentage}
            failDkimPercentage={data.queryDmarcReport.failDkimPercentage}
            failSpfPercentage={data.queryDmarcReport.failSpfPercentage}
          />
        </Stack>
        <Stack>
          <Stack isInline mt="50px">
            <Text fontSize="xl" fontWeight="semibold">
              Orginization name:
            </Text>
            <Text fontSize="xl">{data.queryDmarcReport.orgName || 'null'}</Text>
          </Stack>

          <Stack isInline>
            <Text fontSize="xl" fontWeight="semibold">
              IP address:
            </Text>
            <Text fontSize="xl">
              {data.queryDmarcReport.source.ipAddress || 'null'}
            </Text>
          </Stack>

          <Stack isInline>
            <Text fontSize="xl" fontWeight="semibold">
              Date:
            </Text>
            <Text fontSize="xl">{data.queryDmarcReport.endDate || 'null'}</Text>
          </Stack>

          <Stack isInline>
            <Text fontSize="xl" fontWeight="semibold">
              Report ID:
            </Text>
            <Text fontSize="xl">
              {data.queryDmarcReport.reportId || 'null'}
            </Text>
          </Stack>

          <Stack isInline>
            <Text fontSize="xl" fontWeight="semibold">
              Country:
            </Text>
            <Text fontSize="xl">
              {data.queryDmarcReport.source.country || 'null'}
            </Text>
          </Stack>

          <Stack isInline>
            <Text fontSize="xl" fontWeight="semibold">
              Reverse DNS:
            </Text>
            <Text fontSize="xl">
              {data.queryDmarcReport.source.reverse_dns || 'null'}
            </Text>
          </Stack>

          <Stack isInline>
            <Text fontSize="xl" fontWeight="semibold">
              Base domain:
            </Text>
            <Text fontSize="xl">
              {data.queryDmarcReport.source.base_domain || 'null'}
            </Text>
          </Stack>
          <Stack isInline>
            <Text fontSize="xl" fontWeight="semibold">
              Count:
            </Text>
            <Text fontSize="xl">{data.queryDmarcReport.count || 'null'}</Text>
          </Stack>
          <Stack isInline>
            <Text fontSize="xl" fontWeight="semibold">
              Header from:
            </Text>
            <Text fontSize="xl">
              {data.queryDmarcReport.identifiers.header_from || 'null'}
            </Text>
          </Stack>
        </Stack>

        <Stack>
          <Flex align="center" role="dkimHeader">
            <Text fontSize="2xl" fontWeight="bold">
              DKIM
            </Text>
            {data.queryDmarcReport.dkimResult ? (
              <Icon
                ml={2}
                name="check-circle"
                size="26px"
                color="green.500"
                role="passIcon"
              />
            ) : (
              <Icon
                ml={2}
                name="warning"
                size="26px"
                color="red.500"
                role="failIcon"
              />
            )}
          </Flex>

          {data.queryDmarcReport.dkim.map((dkim) => {
            return (
              <DkimEntry
                key={dkim.domain}
                domain={dkim.domain}
                selector={dkim.selector}
                result={dkim.result}
              />
            )
          })}

          <Button
            mt={'5px'}
            variantColor="teal"
            variant="link"
            justifyContent="start"
            onClick={() => {
              window.alert('function coming soon')
            }}
          >
            Show all DKIM scans
          </Button>
        </Stack>

        <Stack>
          <Flex align="center" role="spfHeader">
            <Text fontSize="2xl" fontWeight="bold">
              SPF
            </Text>
            {data.queryDmarcReport.spfResult ? (
              <Icon
                ml={2}
                name="check-circle"
                size="26px"
                color="green.500"
                role="passIcon"
              />
            ) : (
              <Icon
                ml={2}
                name="warning"
                size="26px"
                color="red.500"
                role="failIcon"
              />
            )}
          </Flex>

          {data.queryDmarcReport.spf.map((spf) => {
            return (
              <SpfEntry
                key={spf.domain}
                domain={spf.domain}
                scope={spf.scope}
                result={spf.result}
              />
            )
          })}
          <Button
            mt={'5px'}
            variantColor="teal"
            variant="link"
            justifyContent="start"
            onClick={() => {
              window.alert('function coming soon')
            }}
          >
            Show all SPF scans
          </Button>
        </Stack>
      </SimpleGrid>
    </Box>
  )
}
