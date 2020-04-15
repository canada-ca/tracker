import React from 'react'

import { Text, Stack, SimpleGrid, Box } from '@chakra-ui/core'

export function DmarcReportBreakdown(props) {
  return (
    <Box mt="50px">
      <Text fontSize="2xl" fontWeight="bold" textAlign="center">
        Report Breakdown
      </Text>
      <SimpleGrid
        mt="40px"
        columns={{ sm: 1, md: 1, lg: 4, xl: 4 }}
        spacing="20px"
      >
        <Stack isInline>
          <Text fontSize="lg" fontWeight="semibold">
            Message Count:
          </Text>
          <Text fontSize="lg">1234</Text>
        </Stack>

        <Stack isInline>
          <Text fontSize="lg" fontWeight="semibold">
            Passed Dmarc:{' '}
          </Text>
          <Text fontSize="lg">{props.passDmarcPercentage}%</Text>
        </Stack>
        <Stack isInline>
          <Text fontSize="lg" fontWeight="semibold">
            Fail Dmarc:{' '}
          </Text>
          <Text fontSize="lg">{props.failDmarcPercentage}%</Text>
        </Stack>
        <Stack isInline>
          <Text fontSize="lg" fontWeight="semibold">
            Fail Dkim:{' '}
          </Text>
          <Text fontSize="lg">{props.failDkimPercentage}%</Text>
        </Stack>
        <Stack isInline>
          <Text fontSize="lg" fontWeight="semibold">
            Fail Dkim:{' '}
          </Text>
          <Text fontSize="lg">{props.failSpfPercentage}%</Text>
        </Stack>

        <Stack isInline>
          <Text fontSize="lg" fontWeight="semibold">
            Orginization name:
          </Text>
          <Text fontSize="lg">{props.orgName || 'null'}</Text>
        </Stack>

        <Stack isInline>
          <Text fontSize="lg" fontWeight="semibold">
            IP address:
          </Text>
          <Text fontSize="lg">{props.ipAddress || 'null'}</Text>
        </Stack>

        <Stack isInline>
          <Text fontSize="lg" fontWeight="semibold">
            Date:
          </Text>
          <Text fontSize="lg">{props.endDate || 'null'}</Text>
        </Stack>

        <Stack isInline>
          <Text fontSize="lg" fontWeight="semibold">
            Report ID:
          </Text>
          <Text fontSize="lg">{props.reportId || 'null'}</Text>
        </Stack>

        <Stack isInline>
          <Text fontSize="lg" fontWeight="semibold">
            Country:
          </Text>
          <Text fontSize="lg">{props.country || 'null'}</Text>
        </Stack>

        <Stack isInline>
          <Text fontSize="lg" fontWeight="semibold">
            Reverse DNS:
          </Text>
          <Text fontSize="lg">{props.reverse_dns || 'null'}</Text>
        </Stack>

        <Stack isInline>
          <Text fontSize="lg" fontWeight="semibold">
            Base domain:
          </Text>
          <Text fontSize="lg">{props.base_domain || 'null'}</Text>
        </Stack>
        <Stack isInline>
          <Text fontSize="lg" fontWeight="semibold">
            Header from:
          </Text>
          <Text fontSize="lg">{props.header_from || 'null'}</Text>
        </Stack>
      </SimpleGrid>
    </Box>
  )
}

//TODO: ADD PROP TYPES HERE!!!
