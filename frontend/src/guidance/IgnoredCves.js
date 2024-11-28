import React from 'react'
import { Box, Button, Divider, Flex, SimpleGrid, Text } from '@chakra-ui/react'
import { t, Trans } from '@lingui/macro'
import withSuperAdmin from '../app/withSuperAdmin'
import PropTypes from 'prop-types'

function IgnoredCves({ undetectedIgnoredCves, detectedIgnoredCves, setActiveCveHandler }) {
  const vulnerabilitySeverities = { critical: t`Critical`, high: t`High`, medium: t`Medium`, low: t`Low` }
  const cveSeverityOnHover = { critical: 'red.100', high: 'orange.100', medium: 'yellow.50', low: 'gray.100' }

  return (
    <>
      <Divider borderBottomColor="gray.900" />
      <Flex flexDirection="column">
        <Box mb="2">
          <Text>
            <Trans>Detected Ignored CVEs:</Trans>
          </Text>
          <Box px="2">
            {!detectedIgnoredCves || Object.keys(detectedIgnoredCves).length === 0 ? (
              <Text>
                <Trans>None</Trans>
              </Text>
            ) : (
              Object.keys(vulnerabilitySeverities).map((severity) => {
                return (
                  detectedIgnoredCves[severity]?.length > 0 && (
                    <Box key={severity} mb="2">
                      <Text>
                        <b>{vulnerabilitySeverities[severity]}</b>
                      </Text>
                      <SimpleGrid columns={8}>
                        {detectedIgnoredCves[severity].map(({ cve }) => {
                          return (
                            <Button
                              key={cve}
                              borderRadius="full"
                              m="1"
                              borderColor="black"
                              borderWidth="1px"
                              bg={severity}
                              fontWeight="normal"
                              size="sm"
                              _hover={{ bg: cveSeverityOnHover[severity] }}
                              onClick={() => {
                                setActiveCveHandler(cve)
                              }}
                            >
                              {cve}
                            </Button>
                          )
                        })}
                      </SimpleGrid>
                    </Box>
                  )
                )
              })
            )}
          </Box>
          <Text>
            <Trans>Undetected Ignored CVEs:</Trans>
          </Text>
          <Box px="2">
            {!undetectedIgnoredCves || undetectedIgnoredCves.length === 0 ? (
              <Text>
                <Trans>None</Trans>
              </Text>
            ) : (
              <SimpleGrid columns={8}>
                {undetectedIgnoredCves.map((cve) => {
                  return (
                    <Button
                      key={`ignored-${cve}`}
                      borderRadius="full"
                      m="1"
                      borderColor="black"
                      borderWidth="1px"
                      bg="gray.100"
                      fontWeight="normal"
                      size="sm"
                      _hover={{ bg: 'gray.200' }}
                      onClick={() => {
                        setActiveCveHandler(cve)
                      }}
                    >
                      {cve}
                    </Button>
                  )
                })}
              </SimpleGrid>
            )}
          </Box>
        </Box>
      </Flex>
    </>
  )
}

export default withSuperAdmin(IgnoredCves)

IgnoredCves.propTypes = {
  undetectedIgnoredCves: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
  detectedIgnoredCves: PropTypes.object.isRequired,
  setActiveCveHandler: PropTypes.func.isRequired,
}
