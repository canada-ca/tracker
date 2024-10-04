import React from 'react'
import { Box, Button, Divider, Flex, SimpleGrid, Text } from '@chakra-ui/react'
import { Trans } from '@lingui/macro'
import withSuperAdmin from '../app/withSuperAdmin'
import PropTypes from 'prop-types'

function IgnoredCves({ ignoredCves, setActiveCveHandler }) {
  return (
    <>
      <Divider borderBottomColor="gray.900" />
      <Flex flexDirection="column">
        <Box px="2" mb="2">
          <Text fontWeight="bold">
            <Trans>Ignored CVEs:</Trans>
          </Text>
          {!ignoredCves || ignoredCves.length === 0 ? (
            <Text>
              <Trans>None</Trans>
            </Text>
          ) : (
            <SimpleGrid columns={8}>
              {ignoredCves &&
                ignoredCves.map((cve) => {
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
      </Flex>
    </>
  )
}

export default withSuperAdmin(IgnoredCves)

IgnoredCves.propTypes = {
  ignoredCves: PropTypes.array.isRequired,
  setActiveCveHandler: PropTypes.func.isRequired,
}
