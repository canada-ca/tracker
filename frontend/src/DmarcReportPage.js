import React from 'react'
import {
  Heading,
  Box,
  Text,
  Stack,
  SimpleGrid,
  Icon,
  Flex,
  Divider,
  Button,
} from '@chakra-ui/core'

import PieChart from 'react-minimal-pie-chart'

const testData = {
  xml_schema: 'draft',
  report_metadata: {
    org_name: 'google.com',
    org_email: 'noreply-dmarc-support@google.com',
    org_extra_contact_info: 'https://support.google.com/a/answer/2466580',
    report_id: '1627703331531660819',
    begin_date: '2019-02-09 19:00:00',
    end_date: '2019-02-10 18:59:59',
    errors: [],
  },
  policy_published: {
    domain: 'twlnet.com',
    adkim: 's',
    aspf: 's',
    p: 'reject',
    sp: 'reject',
    pct: '100',
    fo: '0',
  },
  records: [
    {
      source: {
        ip_address: '87.106.127.28',
        country: 'DE',
        reverse_dns: null,
        base_domain: null,
      },
      count: 1,
      alignment: {
        spf: true,
        dkim: true,
        dmarc: true,
      },
      policy_evaluated: {
        disposition: 'none',
        dkim: 'pass',
        spf: 'pass',
        policy_override_reasons: [],
      },
      identifiers: {
        header_from: 'twlnet.com',
        envelope_from: 'twlnet.com',
        envelope_to: null,
      },
      auth_results: {
        dkim: [
          {
            domain: 'twlnet.com',
            selector: '201810',
            result: 'pass',
          },
        ],
        spf: [
          {
            domain: 'twlnet.com',
            scope: 'mfrom',
            result: 'pass',
          },
        ],
      },
    },
  ],
}

const spfItems = testData.records[0].auth_results.spf.map(spf => {
  return (
    <Box key={spf.domain}>
      <Stack isInline>
        <Text fontSize="xl" fontWeight="semibold">
          Domain:
        </Text>
        <Text fontSize="xl">{spf.domain}</Text>
      </Stack>

      <Stack isInline>
        <Text fontSize="xl" fontWeight="semibold">
          Scope:
        </Text>
        <Text fontSize="xl">{spf.scope}</Text>
      </Stack>

      <Stack isInline>
        <Text fontSize="xl" fontWeight="semibold">
          Result:
        </Text>
        <Text fontSize="xl">{spf.result}</Text>
      </Stack>
      <Divider />
    </Box>
  )
})

const dkimItems = testData.records[0].auth_results.dkim.map(dkim => {
  return (
    <Box key={dkim.domain}>
      <Stack isInline>
        <Text fontSize="xl" fontWeight="semibold">
          Domain:
        </Text>
        <Text fontSize="xl">{dkim.domain}</Text>
      </Stack>

      <Stack isInline>
        <Text fontSize="xl" fontWeight="semibold">
          Selector:
        </Text>
        <Text fontSize="xl">{dkim.selector}</Text>
      </Stack>

      <Stack isInline>
        <Text fontSize="xl" fontWeight="semibold">
          Result:
        </Text>
        <Text fontSize="xl">{dkim.result}</Text>
      </Stack>
      <Divider />
    </Box>
  )
})

export function DmarcReportPage() {
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
          <Flex align="center">
            <Text fontSize="2xl" fontWeight="bold">
              DMARC
            </Text>
            {testData.records[0].policy_evaluated.dkim === 'pass' ||
            testData.records[0].policy_evaluated.spf === 'pass' ? (
              <Icon ml={2} name="check-circle" size="26px" color="green.500" />
            ) : (
              <Icon ml={2} name="warning" size="26px" color="red.500" />
            )}
          </Flex>
          <Flex
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
          >
            <Box w={'40%'} mt="30px">
              <PieChart
                animate={true}
                data={[{ title: 'Passed Dmarc', value: 30, color: '#2D8133' }]}
              />
            </Box>
            <Text fontSize="lg" fontWeight="semibold" mt={5}>
              Result Breakdown
            </Text>
            <Text fontSize="lg">
              Pass: 100%
            </Text>
            <Text fontSize="lg">
              Fail: 0%
            </Text>
          </Flex>
        </Stack>
        <Stack>
          <Stack isInline mt="50px">
            <Text fontSize="xl" fontWeight="semibold">
              Orginization name:
            </Text>
            <Text fontSize="xl">{testData.report_metadata.org_name}</Text>
          </Stack>

          <Stack isInline>
            <Text fontSize="xl" fontWeight="semibold">
              IP address:
            </Text>
            <Text fontSize="xl">{testData.records[0].source.ip_address}</Text>
          </Stack>

          <Stack isInline>
            <Text fontSize="xl" fontWeight="semibold">
              Date:
            </Text>
            <Text fontSize="xl">{testData.report_metadata.end_date}</Text>
          </Stack>

          <Stack isInline>
            <Text fontSize="xl" fontWeight="semibold">
              Report ID:
            </Text>
            <Text fontSize="xl">{testData.report_metadata.report_id}</Text>
          </Stack>

          <Stack isInline>
            <Text fontSize="xl" fontWeight="semibold">
              Country:
            </Text>
            <Text fontSize="xl">{testData.records[0].source.country}</Text>
          </Stack>

          <Stack isInline>
            <Text fontSize="xl" fontWeight="semibold">
              Reverse DNS:
            </Text>
            <Text fontSize="xl">{testData.records[0].source.reverse_dns}</Text>
          </Stack>

          <Stack isInline>
            <Text fontSize="xl" fontWeight="semibold">
              Base domain:
            </Text>
            <Text fontSize="xl">{testData.records[0].source.base_domain}</Text>
          </Stack>
          <Stack isInline>
            <Text fontSize="xl" fontWeight="semibold">
              Count:
            </Text>
            <Text fontSize="xl">{testData.records[0].count}</Text>
          </Stack>
          <Stack isInline>
            <Text fontSize="xl" fontWeight="semibold">
              Header from:
            </Text>
            <Text fontSize="xl">kaeblesecurity.net</Text>
          </Stack>
        </Stack>

        <Stack>
          <Flex align="center">
            <Text fontSize="2xl" fontWeight="bold">
              DKIM
            </Text>
            {testData.records[0].policy_evaluated.dkim === 'pass' ? (
              <Icon ml={2} name="check-circle" size="26px" color="green.500" />
            ) : (
              <Icon ml={2} name="warning" size="26px" color="red.500" />
            )}
          </Flex>

          {dkimItems}

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
          <Flex align="center">
            <Text fontSize="2xl" fontWeight="bold">
              SPF
            </Text>
            {testData.records[0].policy_evaluated.spf === 'pass' ? (
              <Icon ml={2} name="check-circle" size="26px" color="green.500" />
            ) : (
              <Icon ml={2} name="warning" size="26px" color="red.500" />
            )}
          </Flex>

          {spfItems}

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
