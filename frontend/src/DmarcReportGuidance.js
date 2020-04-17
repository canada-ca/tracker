import React from 'react'
import {
  Box,
  Flex,
  SimpleGrid,
  Text,
  Stack,
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalOverlay,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
  List,
  ListItem,
  Divider,
} from '@chakra-ui/core'
import { Trans } from '@lingui/macro'

export function DmarcReportGuidance() {
  const [show, setShow] = React.useState(true)
  const handleClick = () => {
    setShow(!show)
    console.log('Show: ' + show)
  }
  const {
    isOpen: isOpen1,
    onOpen: onOpen1,
    onClose: onClose1,
  } = useDisclosure()
  const {
    isOpen: isOpen2,
    onOpen: onOpen2,
    onClose: onClose2,
  } = useDisclosure()
  const {
    isOpen: isOpen3,
    onOpen: onOpen3,
    onClose: onClose3,
  } = useDisclosure()
  const {
    isOpen: isOpen4,
    onOpen: onOpen4,
    onClose: onClose4,
  } = useDisclosure()
  const {
    isOpen: isOpen5,
    onOpen: onOpen5,
    onClose: onClose5,
  } = useDisclosure()
  const {
    isOpen: isOpen6,
    onOpen: onOpen6,
    onClose: onClose6,
  } = useDisclosure()

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
          <Button variantColor="teal" mt="20px" w="50%" onClick={onOpen1}>
            <Trans>Guidance</Trans>
          </Button>

          <Modal isOpen={isOpen1} onClose={onClose1}>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>
                <Trans>SPF Check Failed</Trans>
              </ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <Text fontSize="md" fontWeight="semibold">
                  <Trans>Possible Causes</Trans>
                </Text>
                <List styleType="disc">
                  <ListItem>
                    <Trans>
                      The SPF record for the domain is missing or invalid.
                    </Trans>
                  </ListItem>
                  <ListItem>
                    <Trans>There are multiple SPF records. </Trans>
                  </ListItem>
                  <ListItem>
                    <Trans>
                      The sending IP address is not included in the SPF record.
                    </Trans>
                  </ListItem>
                  <ListItem>
                    <Trans>Forwarding by an intermediate server. </Trans>
                  </ListItem>
                </List>
                <Divider />
                <Text fontSize="md" fontWeight="semibold">
                  <Trans>Possible Resolutions</Trans>
                </Text>
                <List styleType="disc">
                  <ListItem>
                    <Trans>Ensure the SPF record is present and valid.</Trans>
                  </ListItem>
                  <ListItem>
                    <Trans>Remove redundant SPF records. </Trans>
                  </ListItem>
                  <ListItem>
                    <Trans>
                      Modify the SPF record to include the sending IP address.
                    </Trans>
                  </ListItem>
                  <ListItem>
                    <Trans>
                      Add an "include" clause for a third party sender.
                    </Trans>
                  </ListItem>
                  <ListItem>
                    <Trans>
                      Configure the server to use the correct domain for the
                      "headerfrom" address.
                    </Trans>
                  </ListItem>
                </List>
              </ModalBody>

              <ModalFooter>
                <Button variantColor="blue" mr={3} onClick={onClose1}>
                  Close
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
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
          <Button variantColor="teal" mt="20px" w="50%" onClick={onOpen2}>
            <Trans>Guidance</Trans>
          </Button>

          <Modal isOpen={isOpen2} onClose={onClose2}>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>
                <Trans>SPF Domain Alignment Failed</Trans>
              </ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <Text fontSize="md" fontWeight="semibold">
                  <Trans>Possible Causes</Trans>
                </Text>
                <List styleType="disc">
                  <ListItem>
                    <Trans>
                      A server configured to use the wrong "envelope from"
                      address.
                    </Trans>
                  </ListItem>
                  <ListItem>
                    <Trans>
                      A third party sender not using a custom return path.
                    </Trans>
                  </ListItem>
                  <ListItem>
                    <Trans>Forwarding by an intermediate server.</Trans>
                  </ListItem>
                </List>
                <Divider />
                <Text fontSize="md" fontWeight="semibold">
                  <Trans>Possible Resolutions</Trans>
                </Text>
                <List styleType="disc">
                  <ListItem>
                    <Trans>
                      Configure the server to use the same domain for the
                      "envelope from" and "header from" addresses.
                    </Trans>
                  </ListItem>
                  <ListItem>
                    <Trans>
                      Add a custom return path for athird party sender.
                    </Trans>
                  </ListItem>
                </List>
              </ModalBody>

              <ModalFooter>
                <Button variantColor="blue" mr={3} onClick={onClose2}>
                  Close
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
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
          <Button variantColor="teal" mt="20px" w="50%" onClick={onOpen3}>
            <Trans>Guidance</Trans>
          </Button>

          <Modal isOpen={isOpen3} onClose={onClose3}>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>
                <Trans>DKIM Check Failed</Trans>
              </ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <Text fontSize="md" fontWeight="semibold">
                  <Trans>Possible Causes</Trans>
                </Text>
                <List styleType="disc">
                  <ListItem>
                    <Trans>The message was not signed with DKIM.</Trans>
                  </ListItem>
                  <ListItem>
                    <Trans>
                      There is no DKIM record for the domain and/or selector
                      used or the record is invalid.
                    </Trans>
                  </ListItem>
                  <ListItem>
                    <Trans>
                      The message was modified by an intermediate server.
                    </Trans>
                  </ListItem>
                </List>
                <Divider />
                <Text fontSize="md" fontWeight="semibold">
                  <Trans>Possible Resolutions</Trans>
                </Text>
                <List styleType="disc">
                  <ListItem>
                    <Trans>
                      Configure the server to sign outbound messages with DKIM.
                    </Trans>
                  </ListItem>
                  <ListItem>
                    <Trans>
                      Ensure the DKIM record for thedomain and selector is
                      present andvalid.
                    </Trans>
                  </ListItem>
                  <ListItem>
                    <Trans>
                      Add a CNAME record to refer to a DKIM record maintained by
                      a third party sender.
                    </Trans>
                  </ListItem>
                </List>
              </ModalBody>

              <ModalFooter>
                <Button variantColor="blue" mr={3} onClick={onClose3}>
                  Close
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
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
          <Button variantColor="teal" mt="20px" w="50%" onClick={onOpen4}>
            <Trans>Guidance</Trans>
          </Button>

          <Modal isOpen={isOpen4} onClose={onClose4}>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>
                <Trans>DKIM Domain Alignment Failed</Trans>
              </ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <Text fontSize="md" fontWeight="semibold">
                  <Trans>Possible Causes</Trans>
                </Text>
                <List styleType="disc">
                  <ListItem>
                    <Trans>
                      The server is configured to use a different domain for the
                      DKIM header than for the "header from" address.
                    </Trans>
                  </ListItem>
                  <ListItem>
                    <Trans>
                      There is no DKIM record for the domain and/or selector
                      used or the record is invalid.
                    </Trans>
                  </ListItem>
                  <ListItem>
                    <Trans>Forwarding by an intermediate server.</Trans>
                  </ListItem>
                </List>
                <Divider />
                <Text fontSize="md" fontWeight="semibold">
                  <Trans>Possible Resolutions</Trans>
                </Text>
                <List styleType="disc">
                  <ListItem>
                    <Trans>
                      Configure the server to use the same domain for the DKIM
                      header as for the "header from" address.
                    </Trans>
                  </ListItem>
                </List>
              </ModalBody>

              <ModalFooter>
                <Button variantColor="blue" mr={3} onClick={onClose4}>
                  Close
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
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
          <Button variantColor="teal" mt="20px" w="50%" onClick={onOpen5}>
            <Trans>Guidance</Trans>
          </Button>
          <Modal isOpen={isOpen5} onClose={onClose5}>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>
                <Trans>DMARC Policy Applied</Trans>
              </ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <Text fontSize="md" fontWeight="semibold">
                  <Trans>Possible Causes</Trans>
                </Text>
                <List styleType="disc">
                  <ListItem>
                    <Trans>
                      The policy applied is based on the DMARC record of the
                      root domain or subdomain.
                    </Trans>
                  </ListItem>
                </List>
                <Divider />
                <Text fontSize="md" fontWeight="semibold">
                  <Trans>Possible Resolutions</Trans>
                </Text>
                <List styleType="disc">
                  <ListItem>
                    <Trans>
                      Adjust the policy portion of the DMARCrecord of the root
                      domain or subdomain.
                    </Trans>
                  </ListItem>
                </List>
              </ModalBody>

              <ModalFooter>
                <Button variantColor="blue" mr={3} onClick={onClose5}>
                  Close
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
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
          <Button variantColor="teal" mt="20px" w="50%" onClick={onOpen6}>
            <Trans>Guidance</Trans>
          </Button>

          <Modal isOpen={isOpen6} onClose={onClose6}>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>
                <Trans>Messages Subject to DMARC Policy</Trans>
              </ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <Text fontSize="md" fontWeight="semibold">
                  <Trans>Possible Causes</Trans>
                </Text>
                <List styleType="disc">
                  <ListItem>
                    <Trans>Please see the SPF and DKIM causes sections.</Trans>
                  </ListItem>
                </List>
                <Divider />
                <Text fontSize="md" fontWeight="semibold">
                  <Trans>Possible Resolutions</Trans>
                </Text>
                <List styleType="disc">
                  <ListItem>
                    <Trans>
                      Please see the SPF and DKIM resolutions sections.
                    </Trans>
                  </ListItem>
                </List>
              </ModalBody>

              <ModalFooter>
                <Button variantColor="blue" mr={3} onClick={onClose6}>
                  Close
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
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
