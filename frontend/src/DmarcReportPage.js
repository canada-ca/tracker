import React from 'react'
import { Trans } from '@lingui/macro'
import {
  Text,
  Stack,
  SimpleGrid,
  Box,
  Button,
  Heading,
  Icon,
  Flex,
  Divider,
} from '@chakra-ui/core'
import { useUserState } from './UserState'
import { useQuery } from '@apollo/react-hooks'
import { QUERY_DMARC_REPORT } from './graphql/queries'
import { DmarcReportGraph } from './DmarcReportGraph'
import { DmarcReportTimeGraph } from './DmarcReportTimeGraph'
import { DmarcReportGuidance } from './DmarcReportGuidance'

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

  const [show, setShow] = React.useState(true)
  const handleClick = () => {
    setShow(!show)
    console.log('Show: ' + show)
  }

  if (loading) return <p>Loading...</p>
  if (error) return <p>{String(error)}</p>
  return (
    <Box p={{ sm: '15px', md: '10px', lg: '0px', xl: '0px' }} mb="100px">
      <Heading mb={4} textAlign={['center', 'left']}>
        DMARC Report
      </Heading>
      <Text w="100%" p={['30px', '0px']}>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
        veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
        commodo consequat.
      </Text>
      <Stack>
        <Flex
          align="center"
          role="dmarcHeader"
          justifyContent={['center', 'left']}
          maxW="100%"
          mt={['0px', '50px']}
        >
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

      <Box mt={['20px', '125px']} p={['30px', '0px']}>
        <Text fontSize="2xl" fontWeight="bold" textAlign="center">
          Report Breakdown
        </Text>
        <SimpleGrid
          mt="40px"
          columns={{ sm: 1, md: 1, lg: 4, xl: 4 }}
          spacing="20px"
        >
          <Stack isInline>
            <Text fontSize="md" fontWeight="semibold">
              Message Count:
            </Text>
            <Text fontSize="md">12345</Text>
          </Stack>

          <Stack isInline>
            <Text fontSize="md" fontWeight="semibold">
              Passed Dmarc:
            </Text>
            <Text fontSize="md">
              {data.queryDmarcReport.passDmarcPercentage}%
            </Text>
          </Stack>
          <Stack isInline display={[show ? 'none' : 'flex', 'flex']}>
            <Text fontSize="md" fontWeight="semibold">
              Fail Dmarc:
            </Text>
            <Text fontSize="md">
              {data.queryDmarcReport.failDmarcPercentage}%
            </Text>
          </Stack>
          <Stack isInline display={[show ? 'none' : 'flex', 'flex']}>
            <Text fontSize="md" fontWeight="semibold">
              Fail Dkim:
            </Text>
            <Text fontSize="md">
              {data.queryDmarcReport.failDkimPercentage}%
            </Text>
          </Stack>
          <Stack isInline display={[show ? 'none' : 'flex', 'flex']}>
            <Text fontSize="md" fontWeight="semibold">
              Fail Dkim:
            </Text>
            <Text fontSize="md">
              {data.queryDmarcReport.failSpfPercentage}%
            </Text>
          </Stack>

          <Stack isInline>
            <Text fontSize="md" fontWeight="semibold">
              Orginization name:
            </Text>
            <Text fontSize="md">{data.queryDmarcReport.orgName || 'null'}</Text>
          </Stack>

          <Stack isInline display={[show ? 'none' : 'flex', 'flex']}>
            <Text fontSize="md" fontWeight="semibold">
              IP address:
            </Text>
            <Text fontSize="md">
              {data.queryDmarcReport.source.ipAddress || 'null'}
            </Text>
          </Stack>

          <Stack isInline display={[show ? 'none' : 'flex', 'flex']}>
            <Text fontSize="md" fontWeight="semibold">
              Date:
            </Text>
            <Text fontSize="md">{data.queryDmarcReport.endDate || 'null'}</Text>
          </Stack>

          <Stack isInline display={[show ? 'none' : 'flex', 'flex']}>
            <Text fontSize="md" fontWeight="semibold">
              Report ID:
            </Text>
            <Text fontSize="md">
              {data.queryDmarcReport.reportId || 'null'}
            </Text>
          </Stack>

          <Stack isInline display={[show ? 'none' : 'flex', 'flex']}>
            <Text fontSize="md" fontWeight="semibold">
              Country:
            </Text>
            <Text fontSize="md">
              {data.queryDmarcReport.source.country || 'null'}
            </Text>
          </Stack>

          <Stack isInline display={[show ? 'none' : 'flex', 'flex']}>
            <Text fontSize="md" fontWeight="semibold">
              Reverse DNS:
            </Text>
            <Text fontSize="md">
              {data.queryDmarcReport.source.reverseDns || 'null'}
            </Text>
          </Stack>

          <Stack isInline display={[show ? 'none' : 'flex', 'flex']}>
            <Text fontSize="md" fontWeight="semibold">
              Base domain:
            </Text>
            <Text fontSize="md">
              {data.queryDmarcReport.source.baseDomain || 'null'}
            </Text>
          </Stack>
          <Stack isInline display={[show ? 'none' : 'flex', 'flex']}>
            <Text fontSize="md" fontWeight="semibold">
              Header from:
            </Text>
            <Text fontSize="md">
              {data.queryDmarcReport.identifiers.headerFrom || 'null'}
            </Text>
          </Stack>
        </SimpleGrid>
        <Button
          variant="link"
          textAlign="center"
          w="100%"
          variantColor="teal"
          mt="10"
          mb="10px"
          onClick={handleClick}
          display={['inline', 'none']}
        >
          {show ? <Trans>Show More</Trans> : <Trans>Show Less</Trans>}
        </Button>
      </Box>

      <Divider
        m={['10px auto', '10px']}
        mt={['10px', '50px']}
        w={['70%', '100%']}
      />
      <DmarcReportTimeGraph />
      <Divider
        m={['10px auto', '10px']}
        mt={['10px', '50px']}
        w={['70%', '100%']}
      />
      <DmarcReportGuidance />
      <Divider
        m={['10px auto', '10px']}
        mt={['10px', '50px']}
        w={['70%', '100%']}
      />
    </Box>
  )
}
