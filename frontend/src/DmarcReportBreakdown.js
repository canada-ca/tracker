import React from 'react'

import { Text, Stack, SimpleGrid, Box, Button } from '@chakra-ui/core'
import { Trans } from '@lingui/macro'

export function DmarcReportBreakdown(props) {
  const [show, setShow] = React.useState(true)
  const handleClick = () => {
    setShow(!show)
    console.log('Show: ' + show)
  }
  return (
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
          <Text fontSize="md">1234</Text>
        </Stack>

        <Stack isInline>
          <Text fontSize="md" fontWeight="semibold">
            Passed Dmarc:{' '}
          </Text>
          <Text fontSize="md">{props.passDmarcPercentage}%</Text>
        </Stack>
        <Stack isInline display={[show ? 'none' : 'flex', 'flex']}>
          <Text fontSize="md" fontWeight="semibold">
            Fail Dmarc:{' '}
          </Text>
          <Text fontSize="md">{props.failDmarcPercentage}%</Text>
        </Stack>
        <Stack isInline display={[show ? 'none' : 'flex', 'flex']}>
          <Text fontSize="md" fontWeight="semibold">
            Fail Dkim:{' '}
          </Text>
          <Text fontSize="md">{props.failDkimPercentage}%</Text>
        </Stack>
        <Stack isInline display={[show ? 'none' : 'flex', 'flex']}>
          <Text fontSize="md" fontWeight="semibold">
            Fail Dkim:{' '}
          </Text>
          <Text fontSize="md">{props.failSpfPercentage}%</Text>
        </Stack>

        <Stack isInline>
          <Text fontSize="md" fontWeight="semibold">
            Orginization name:
          </Text>
          <Text fontSize="md">{props.orgName || 'null'}</Text>
        </Stack>

        <Stack isInline display={[show ? 'none' : 'flex', 'flex']}>
          <Text fontSize="md" fontWeight="semibold">
            IP address:
          </Text>
          <Text fontSize="md">{props.ipAddress || 'null'}</Text>
        </Stack>

        <Stack isInline display={[show ? 'none' : 'flex', 'flex']}>
          <Text fontSize="md" fontWeight="semibold">
            Date:
          </Text>
          <Text fontSize="md">{props.endDate || 'null'}</Text>
        </Stack>

        <Stack isInline display={[show ? 'none' : 'flex', 'flex']}>
          <Text fontSize="md" fontWeight="semibold">
            Report ID:
          </Text>
          <Text fontSize="md">{props.reportId || 'null'}</Text>
        </Stack>

        <Stack isInline display={[show ? 'none' : 'flex', 'flex']}>
          <Text fontSize="md" fontWeight="semibold">
            Country:
          </Text>
          <Text fontSize="md">{props.country || 'null'}</Text>
        </Stack>

        <Stack isInline display={[show ? 'none' : 'flex', 'flex']}>
          <Text fontSize="md" fontWeight="semibold">
            Reverse DNS:
          </Text>
          <Text fontSize="md">{props.reverse_dns || 'null'}</Text>
        </Stack>

        <Stack isInline display={[show ? 'none' : 'flex', 'flex']}>
          <Text fontSize="md" fontWeight="semibold">
            Base domain:
          </Text>
          <Text fontSize="md">{props.base_domain || 'null'}</Text>
        </Stack>
        <Stack isInline display={[show ? 'none' : 'flex', 'flex']}>
          <Text fontSize="md" fontWeight="semibold">
            Header from:
          </Text>
          <Text fontSize="md">{props.header_from || 'null'}</Text>
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
  )
}

//TODO: ADD PROP TYPES HERE!!!
