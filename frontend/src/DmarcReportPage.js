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
import { DmarcReportTimeGraph } from './DmarcReportTimeGraph'
import { DmarcGuidance } from './DmarcGuidance'
import { DmarcReportBreakdown } from './DmarcReportBreakdown'

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
      <Text mb={10}>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
        veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
        commodo consequat.
      </Text>
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
          count={data.queryDmarcReport.count}
        />
      </Stack>

      <DmarcReportBreakdown
        passDmarcPercentage={data.queryDmarcReport.passDmarcPercentage}
        passArcPercentage={data.queryDmarcReport.passArcPercentage}
        failDmarcPercentage={data.queryDmarcReport.failDmarcPercentage}
        failDkimPercentage={data.queryDmarcReport.failDkimPercentage}
        failSpfPercentage={data.queryDmarcReport.failSpfPercentage}
        count={data.queryDmarcReport.count}
      />

      <DmarcReportTimeGraph />
      <DmarcGuidance />

      <SimpleGrid
        columns={{ sm: 1, md: 1, lg: 2, xl: 2 }}
        spacing="50px"
        spacingY={{ sm: '50px', md: '50px', lg: '150px', xl: '150px' }}
        mb="105px"
      >
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
