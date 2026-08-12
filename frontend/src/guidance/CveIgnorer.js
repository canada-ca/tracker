import React, { useState } from 'react'
import { useMutation } from '@apollo/client'
import { IGNORE_CVE, UNIGNORE_CVE } from '../graphql/mutations'
import { Trans, useLingui } from "@lingui/react/macro"
import { Box, Button, Text, useToast } from '@chakra-ui/react'
import withSuperAdmin from '../app/withSuperAdmin'
import PropTypes from 'prop-types'

function CveIgnorer({ cve, isCveIgnored, domainId }) {
  const { t } = useLingui()
  const toast = useToast()
  const [showConfirm, setShowConfirm] = useState(false)

  const [ignoreCve] = useMutation(IGNORE_CVE, {
    refetchQueries: ['GuidanceAdditionalFindings'],
    onError(error) {
      toast({
        title: t`An error occurred.`,
        description: error.message,
        status: 'error',
        duration: 9000,
        isClosable: true,
        position: 'top-left',
      })
    },
    onCompleted({ ignoreCve }) {
      if (ignoreCve.result.__typename === 'Domain') {
        toast({
          title: t`CVE ignored`,
          description: t`Successfully ignored CVE for domain ${ignoreCve.result.domain}. New ignored CVEs: "${
              ignoreCve.result.ignoredCves && JSON.stringify(ignoreCve.result.ignoredCves)
            }".`,
          status: 'success',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
      } else if (ignoreCve.result.__typename === 'DomainError') {
        toast({
          title: t`Unable to ignore CVE.`,
          description: ignoreCve.result.description,
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
      } else {
        toast({
          title: t`Incorrect send method received.`,
          description: t`Incorrect ignoreCve.result typename.`,
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
        console.log('Incorrect ignoreCve.result typename.')
      }
    },
  })

  const [unignoreCve] = useMutation(UNIGNORE_CVE, {
    refetchQueries: ['GuidanceAdditionalFindings'],
    onError(error) {
      toast({
        title: t`An error occurred.`,
        description: error.message,
        status: 'error',
        duration: 9000,
        isClosable: true,
        position: 'top-left',
      })
    },
    onCompleted({ unignoreCve }) {
      if (unignoreCve.result.__typename === 'Domain') {
        toast({
          title: t`Stopped ignoring CVE`,
          description: t`Successfully stopped ignoring CVE for domain "${unignoreCve.result.domain}". New ignored CVEs: "${
              unignoreCve.result.ignoredCves && JSON.stringify(unignoreCve.result.ignoredCves)
            }".`,
          status: 'success',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
      } else if (unignoreCve.result.__typename === 'DomainError') {
        toast({
          title: t`Unable to stop ignoring CVE.`,
          description: unignoreCve.result.description,
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
      } else {
        toast({
          title: t`Incorrect send method received.`,
          description: t`Incorrect unignoreCve.result typename.`,
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
        console.log('Incorrect unignoreCve.result typename.')
      }
    },
  })

  return (
      <Box>
        <Button variant="primary" mr="4" type="submit" isLoading={false} px={8} onClick={() => setShowConfirm(true)}>
          {isCveIgnored ? <Trans>Stop Ignoring CVE</Trans> : <Trans>Ignore CVE</Trans>}
        </Button>
        {showConfirm && (
          <Box mt="4">
            <Text mb="4">
              {isCveIgnored ? (
                <Trans>Are you sure you want to stop ignoring this CVE?</Trans>
              ) : (
                <Trans>Are you sure you want to ignore this CVE?</Trans>
              )}
            </Text>

            <Button variant="primaryOutline" mr="4" onClick={() => setShowConfirm(false)}>
              <Trans>Back</Trans>
            </Button>

            <Button
              variant="primary"
              mr="4"
              type="submit"
              isLoading={false}
              px={8}
              onClick={async () => {
                if (isCveIgnored) {
                  await unignoreCve({
                    variables: {
                      domainId,
                      ignoredCve: cve,
                    },
                  })
                } else {
                  await ignoreCve({
                    variables: {
                      domainId,
                      ignoredCve: cve,
                    },
                  })
                }
                setShowConfirm(false)
              }}
            >
              <Trans>Confirm</Trans>
            </Button>
          </Box>
        )}
      </Box>
  )
}

export default withSuperAdmin(CveIgnorer)

CveIgnorer.propTypes = {
  cve: PropTypes.string.isRequired,
  isCveIgnored: PropTypes.bool.isRequired,
  domainId: PropTypes.string.isRequired,
}
