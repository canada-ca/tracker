import React from 'react'
import { Box, Flex, SimpleGrid, Text, Stack, Button } from '@chakra-ui/core'
import { Trans } from '@lingui/macro'

export function DmarcGuidance() {
  const [show, setShow] = React.useState(true)
  const handleClick = () => {
    setShow(!show)
    console.log('Show: ' + show)
  }

  return (
    <Box mt={['30px', '100px']}>
      <Text fontSize="2xl" fontWeight="bold" textAlign="center">
        Guidance
      </Text>
      <Flex alignItems="center" justifyContent="center">
        <Text fontSize="md" w="90%" mt="20px">
          <Trans>
            These guidance notes were designed to help you trouble shoot your
            failed DMARC scans. Please read through each note and determine what
            has caused a failed DMARC scan on your domain.
          </Trans>
        </Text>
      </Flex>
      <SimpleGrid
        columns={{ sm: 1, md: 1, lg: 3, xl: 3 }}
        spacing="100px"
        spacingY="50px"
        textAlign="center"
        mt="40px"
        ml={['15px', '0px']}
        mr={['15px', '0px']}
      >
        <Stack
          display={[show ? 'none' : 'flex', 'flex']}
          alignItems="center"
          backgroundColor="#F2F2F2"
          p="25px"
          borderRadius="5px"
        >
          <Text fontSize="md" fontWeight="semibold">
            <Trans>SPF Check Failed</Trans>
          </Text>
          <Text
            fontSize="md"
            mt="10px"
            pl={['30px', '0px']}
            pr={['30px', '0px']}
          >
            <Trans>
              The receiving server found that the sending IP address was not
              authorized to send mail on behalf of the domain.
            </Trans>
          </Text>
          <Button variantColor="teal" mt="20px" w="50%">
            <Trans>Guidance</Trans>
          </Button>
        </Stack>
        <Stack
          display={[show ? 'none' : 'flex', 'flex']}
          alignItems="center"
          backgroundColor="#F2F2F2"
          p="25px"
          borderRadius="5px"
        >
          <Text fontSize="md" fontWeight="semibold">
            <Trans>SPF Domain Alignment Failed</Trans>
          </Text>
          <Text
            fontSize="md"
            mt="10px"
            pl={['30px', '0px']}
            pr={['30px', '0px']}
          >
            <Trans>
              The receiving server found that the domains used in the "envelope
              from" and "header from" email addresses did not match.
            </Trans>
          </Text>
          <Button variantColor="teal" mt="20px" w="50%">
            <Trans>Guidance</Trans>
          </Button>
        </Stack>
        <Stack
          display={[show ? 'none' : 'flex', 'flex']}
          alignItems="center"
          backgroundColor="#F2F2F2"
          p="25px"
          borderRadius="5px"
        >
          <Text fontSize="md" fontWeight="semibold">
            <Trans>DKIM Check Failed</Trans>
          </Text>
          <Text
            fontSize="md"
            mt="10px"
            pl={['30px', '0px']}
            pr={['30px', '0px']}
          >
            <Trans>
              The receiving server found that the message had no DKIM signature,
              or that verification of the signature failed.
            </Trans>
          </Text>
          <Button variantColor="teal" mt="20px" w="50%">
            <Trans>Guidance</Trans>
          </Button>
        </Stack>
        <Stack
          display={[show ? 'none' : 'flex', 'flex']}
          alignItems="center"
          backgroundColor="#F2F2F2"
          p="25px"
          borderRadius="5px"
        >
          <Text fontSize="md" fontWeight="semibold">
            <Trans>DKIM Domain Alignment Failed</Trans>
          </Text>
          <Text
            fontSize="md"
            mt="10px"
            pl={['30px', '0px']}
            pr={['30px', '0px']}
          >
            <Trans>
              The receiving server found that the domains usedin the DKIM header
              and the "header from" email address did not match.
            </Trans>
          </Text>
          <Button variantColor="teal" mt="20px" w="50%">
            <Trans>Guidance</Trans>
          </Button>
        </Stack>
        <Stack
          display={[show ? 'none' : 'flex', 'flex']}
          alignItems="center"
          backgroundColor="#F2F2F2"
          p="25px"
          borderRadius="5px"
        >
          <Text fontSize="md" fontWeight="semibold">
            <Trans>DMARC Policy Applied</Trans>
          </Text>
          <Text
            fontSize="md"
            mt="10px"
            pl={['30px', '0px']}
            pr={['30px', '0px']}
          >
            <Trans>
              The DMARC policy (i.e. none, quarantine, orreject) that was
              applied to messages which failured DMARC (i.e. failed both SPF and
              DKIM).
            </Trans>
          </Text>
          <Button variantColor="teal" mt="20px" w="50%">
            <Trans>Guidance</Trans>
          </Button>
        </Stack>
        <Stack
          display={[show ? 'none' : 'flex', 'flex']}
          alignItems="center"
          backgroundColor="#F2F2F2"
          p="25px"
          borderRadius="5px"
        >
          <Text fontSize="md" fontWeight="semibold">
            <Trans>Messages Subject to DMARC Policy</Trans>
          </Text>
          <Text
            fontSize="md"
            mt="10px"
            pl={['30px', '0px']}
            pr={['30px', '0px']}
          >
            <Trans>
              Received messages failed both SPF and DKIM, and therefore failed
              DMARC. The DMARC policy specified for the domain was applied to
              these messages.
            </Trans>
          </Text>
          <Button variantColor="teal" mt="20px" w="50%">
            <Trans>Guidance</Trans>
          </Button>
        </Stack>
      </SimpleGrid>
      <Button
        variant="link"
        textAlign="center"
        w="100%"
        variantColor="teal"
        mt="10"
        mb="10px"
        display={['inline', 'none']}
        onClick={handleClick}
      >
        {show ? <Trans>Show Guidance</Trans> : <Trans>Hide Guidance</Trans>}
      </Button>
    </Box>
  )
}
