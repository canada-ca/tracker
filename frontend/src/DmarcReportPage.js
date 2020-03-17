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
} from '@chakra-ui/core'

import PieChart from 'react-minimal-pie-chart'

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
            <Icon ml={2} name="check-circle" size="26px" color="green.500" />
          </Flex>
          <Flex
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
          >
            <Box w={'40%'} mt="50px">
              <PieChart
                animate={true}
                data={[
                  { title: 'Passed Dmarc', value: 30, color: '#2D8133' },
                  { title: 'Failed Dmarc', value: 15, color: '#e53e3e' },
                ]}
              />
            </Box>
            <Text fontSize="lg" mt={5}>
              Result Breakdown
            </Text>
          </Flex>
        </Stack>
        <Stack>
          <Stack isInline mt="100px">
            <Text fontSize="xl" fontWeight="semibold">
              IP address:
            </Text>
            <Text fontSize="xl">127.0.0.0</Text>
          </Stack>

          <Stack isInline>
            <Text fontSize="xl" fontWeight="semibold">
              Date:
            </Text>
            <Text fontSize="xl">2020-03-15 19:59:59</Text>
          </Stack>

          <Stack isInline>
            <Text fontSize="xl" fontWeight="semibold">
              Country:
            </Text>
            <Text fontSize="xl">Canada</Text>
          </Stack>

          <Stack isInline>
            <Text fontSize="xl" fontWeight="semibold">
              Reverse DNS:
            </Text>
            <Text fontSize="xl">null</Text>
          </Stack>

          <Stack isInline>
            <Text fontSize="xl" fontWeight="semibold">
              Base domain:
            </Text>
            <Text fontSize="xl">null</Text>
          </Stack>
        </Stack>

        <Stack>
          <Flex align="center">
            <Text fontSize="2xl" fontWeight="bold">
              DKIM
            </Text>
            <Icon ml={2} name="warning" size="26px" color="red.500" />
          </Flex>
          <Stack isInline>
            <Text fontSize="xl" fontWeight="semibold">
              Domain:
            </Text>
            <Text fontSize="xl">kaeblesecurity.net</Text>
          </Stack>

          <Stack isInline>
            <Text fontSize="xl" fontWeight="semibold">
              Selector:
            </Text>
            <Text fontSize="xl">smn43x76zchdt62tkzb73jkcmn7t6zzm</Text>
          </Stack>

          <Stack isInline>
            <Text fontSize="xl" fontWeight="semibold">
              Result:
            </Text>
            <Text fontSize="xl">Pass</Text>
          </Stack>

          <Divider />

          <Stack isInline>
            <Text fontSize="xl" fontWeight="semibold">
              Domain:
            </Text>
            <Text fontSize="xl">amazonses.com</Text>
          </Stack>

          <Stack isInline>
            <Text fontSize="xl" fontWeight="semibold">
              Selector:
            </Text>
            <Text fontSize="xl">224i4yxa5dv7c2xz3womw6peuasteono</Text>
          </Stack>

          <Stack isInline>
            <Text fontSize="xl" fontWeight="semibold">
              Result:
            </Text>
            <Text fontSize="xl">Pass</Text>
          </Stack>
        </Stack>
        <Stack>
          <Flex align="center">
            <Text fontSize="2xl" fontWeight="bold">
              SPF
            </Text>
            <Icon ml={2} name="check-circle" size="26px" color="green.500" />
          </Flex>

          <Stack isInline>
            <Text fontSize="xl" fontWeight="semibold">
              Domain:
            </Text>
            <Text fontSize="xl">amazonses.com</Text>
          </Stack>

          <Stack isInline>
            <Text fontSize="xl" fontWeight="semibold">
              Scope:
            </Text>
            <Text fontSize="xl">mfrom</Text>
          </Stack>

          <Stack isInline>
            <Text fontSize="xl" fontWeight="semibold">
              Result:
            </Text>
            <Text fontSize="xl">Pass</Text>
          </Stack>
        </Stack>
      </SimpleGrid>
    </Box>
  )
}
