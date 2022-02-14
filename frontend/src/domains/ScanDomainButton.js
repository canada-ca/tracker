import React from 'react'
import { string } from 'prop-types'
import { IconButton, keyframes, useToast } from '@chakra-ui/react'
import { RepeatIcon } from '@chakra-ui/icons'
import { useMutation } from '@apollo/client'
import { REQUEST_SCAN } from '../graphql/mutations'
import { t } from '@lingui/macro'

const spin = keyframes`
  from {transform: rotate(0deg);}
  to {transform: rotate(360deg)}
`

export function ScanDomainButton({ domain, ...props }) {
  const toast = useToast()

  const [
    requestScan,
    { loading: requestScanLoading, error: _requestScanError },
  ] = useMutation(REQUEST_SCAN, {
    onError: ({ message }) => {
      toast({
        title: t`An error occurred while requesting a scan.`,
        description: message,
        status: 'error',
        duration: 9000,
        isClosable: true,
        position: 'top-left',
      })
    },
    onCompleted({ _requestScan }) {
      toast({
        title: t`Requested Scan`,
        description: t`You have successfully requested a scan.`,
        status: 'success',
        duration: 9000,
        isClosable: true,
        position: 'top-left',
      })
    },
  })

  const spinAnimation = `${spin} infinite 1s linear`
  const animationPlayState = requestScanLoading ? 'running' : 'paused'

  return (
    <IconButton
      variant="primary"
      colorScheme="teal"
      icon={
        <RepeatIcon sx={{ animationPlayState }} animation={spinAnimation} />
      }
      aria-label={`Request scan for ${domain}`}
      onClick={async () => {
        await requestScan({ variables: { domain } })
      }}
      {...props}
    />
  )
}

ScanDomainButton.propTypes = {
  domain: string.isRequired,
}
