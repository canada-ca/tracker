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

import { useQuery } from '@apollo/react-hooks'
import gql from 'graphql-tag'

import PieChart from 'react-minimal-pie-chart'

export function DmarcReportPage() {
  const { loading, error, data } = useQuery(gql`
    {
      dmarcReport {
        reportId
        orgName
        endDate
        dmarcResult
        dkimResult
        spfResult
        passPercentage
        count
        dkim {
          domain
          selector
          result
        }
        spf {
          domain
          scope
          result
        }
        source {
          ipAddress
          country
          reverseDns
          baseDomain
        }
        identifiers {
          headerFrom
        }
      }
    }
  `)

  if (loading) return <p>Loading...</p>
  if (error) return <p>Error :(</p>
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
            {data.dmarcReport.dmarcResult === 'pass' ? (
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
                data={[
                  {
                    title: 'Passed Dmarc',
                    value: data.dmarcReport.passPercentage,
                    color: '#2D8133',
                  },
                  {
                    title: 'Failed Dmarc',
                    value: 100 - data.dmarcReport.passPercentage,
                    color: '#e53e3e',
                  },
                ]}
              />
            </Box>
            <Text fontSize="lg" fontWeight="semibold" mt={5}>
              Result Breakdown
            </Text>

            <Text fontSize="lg">
              Pass: {data.dmarcReport.passPercentage}%
            </Text>
            <Text fontSize="lg">
              Fail: {100 - data.dmarcReport.passPercentage}%
            </Text>
          </Flex>
        </Stack>
        <Stack>
          <Stack isInline mt="50px">
            <Text fontSize="xl" fontWeight="semibold">
              Orginization name:
            </Text>
            <Text fontSize="xl">{data.dmarcReport.orgName || 'null'}</Text>
          </Stack>

          <Stack isInline>
            <Text fontSize="xl" fontWeight="semibold">
              IP address:
            </Text>
            <Text fontSize="xl">
              {data.dmarcReport.source.ip_address || 'null'}
            </Text>
          </Stack>

          <Stack isInline>
            <Text fontSize="xl" fontWeight="semibold">
              Date:
            </Text>
            <Text fontSize="xl">{data.dmarcReport.endDate || 'null'}</Text>
          </Stack>

          <Stack isInline>
            <Text fontSize="xl" fontWeight="semibold">
              Report ID:
            </Text>
            <Text fontSize="xl">{data.dmarcReport.reportId || 'null'}</Text>
          </Stack>

          <Stack isInline>
            <Text fontSize="xl" fontWeight="semibold">
              Country:
            </Text>
            <Text fontSize="xl">
              {data.dmarcReport.source.country || 'null'}
            </Text>
          </Stack>

          <Stack isInline>
            <Text fontSize="xl" fontWeight="semibold">
              Reverse DNS:
            </Text>
            <Text fontSize="xl">
              {data.dmarcReport.source.reverse_dns || 'null'}
            </Text>
          </Stack>

          <Stack isInline>
            <Text fontSize="xl" fontWeight="semibold">
              Base domain:
            </Text>
            <Text fontSize="xl">
              {data.dmarcReport.source.base_domain || 'null'}
            </Text>
          </Stack>
          <Stack isInline>
            <Text fontSize="xl" fontWeight="semibold">
              Count:
            </Text>
            <Text fontSize="xl">{data.dmarcReport.count || 'null'}</Text>
          </Stack>
          <Stack isInline>
            <Text fontSize="xl" fontWeight="semibold">
              Header from:
            </Text>
            <Text fontSize="xl">
              {data.dmarcReport.identifiers.header_from || 'null'}
            </Text>
          </Stack>
        </Stack>

        <Stack>
          <Flex align="center">
            <Text fontSize="2xl" fontWeight="bold">
              DKIM
            </Text>
            {data.dmarcReport.dkimResult === 'pass' ? (
              <Icon ml={2} name="check-circle" size="26px" color="green.500" />
            ) : (
              <Icon ml={2} name="warning" size="26px" color="red.500" />
            )}
          </Flex>

          {data.dmarcReport.dkim.map(dkim => {
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
          <Flex align="center">
            <Text fontSize="2xl" fontWeight="bold">
              SPF
            </Text>
            {data.dmarcReport.spfResult === 'pass' ? (
              <Icon ml={2} name="check-circle" size="26px" color="green.500" />
            ) : (
              <Icon ml={2} name="warning" size="26px" color="red.500" />
            )}
          </Flex>

          {data.dmarcReport.spf.map(spf => {
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
