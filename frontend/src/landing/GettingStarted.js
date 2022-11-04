import React from 'react'
import {
  Button,
  Link,
  Text,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  UnorderedList,
  ListItem,
  OrderedList,
} from '@chakra-ui/react'
import { Trans } from '@lingui/macro'
import { Link as RouteLink } from 'react-router-dom'
import { QuestionIcon } from '@chakra-ui/icons'

export function GettingStarted() {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const btnRef = React.useRef()
  return (
    <>
      <Button ref={btnRef} variant="primary" onClick={onOpen}>
        Get Started <QuestionIcon ml="2" />
      </Button>
      <Drawer
        isOpen={isOpen}
        placement="bottom"
        onClose={onClose}
        finalFocusRef={btnRef}
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Getting Started Using Tracker</DrawerHeader>

          <DrawerBody>
            <Text fontWeight="bold">
              <Trans>Getting an Account:</Trans>
            </Text>
            <UnorderedList mb="2">
              <ListItem>
                <Text>
                  <Trans>
                    Identify any current Tracker resources within your
                    organization and develop a plan with them.
                  </Trans>
                </Text>
              </ListItem>
              <ListItem>
                <Text>
                  <Trans>
                    If your organization has no resources within Tracker,
                    contact the TBS Cyber mailbox to assist in onboarding.
                  </Trans>
                </Text>
              </ListItem>
              <ListItem>
                <Text>
                  <Trans>
                    After the identified resources are given access to your
                    organization by the TBS Cyber team, they will be able to
                    invite and manage other users within the organization and
                    manage the domain list.
                  </Trans>
                </Text>
              </ListItem>
            </UnorderedList>
            <Text fontWeight="bold">
              <Trans>Understanding Scan Metrics:</Trans>
            </Text>
            <UnorderedList mb="2">
              <ListItem>
                <Text>
                  <Trans>
                    The summary cards show two metrics that Tracker scans:
                  </Trans>
                </Text>
                <OrderedList>
                  <ListItem>
                    <Trans>
                      The percentage of web-hosting services that strongly
                      enforce HTTPS
                    </Trans>
                  </ListItem>
                  <ListItem>
                    <Trans>
                      The percentage of internet-facing services that have a
                      DMARC policy of at least p=”none”
                    </Trans>
                  </ListItem>
                </OrderedList>
              </ListItem>
              <ListItem>
                <Text>
                  <Trans>
                    These metrics are an important first step in securing your
                    services and should be treated as minimum requirements.
                    Further metrics are available in your organization's domain
                    list.
                  </Trans>
                </Text>
              </ListItem>
            </UnorderedList>
            <Text fontWeight="bold">
              <Trans>Managing Your Domains:</Trans>
            </Text>
            <UnorderedList mb="2">
              <ListItem>
                <Text>
                  <Trans>
                    Each organization’s domain list should include every
                    internet-facing service. It is the responsibility of org
                    admins to manage the current list and identify new domains
                    to add.
                  </Trans>
                </Text>
              </ListItem>
              <ListItem>
                <Text>
                  <Trans>
                    To receive DKIM scan results and guidance, you must add the
                    DKIM selectors used for each domain.
                  </Trans>
                </Text>
              </ListItem>
              <ListItem>
                <Text>
                  <Trans>
                    Domains are only to be removed from your list when they no
                    longer exist, meaning they are deleted from the DNS, or if
                    you have identified that they do not belong to your
                    organization.
                  </Trans>
                </Text>
              </ListItem>
              <ListItem>
                <Text>
                  <Trans>
                    If a domain is no longer in use but still exists on the DNS,
                    it is still vulnerable to email spoofing attacks (and should
                    remain in Tracker).
                  </Trans>
                </Text>
              </ListItem>
            </UnorderedList>
            <Text fontWeight="bold" mb="2">
              <Trans>References:</Trans>
            </Text>

            <Text>
              <Trans>Web Security:</Trans>
            </Text>
            <UnorderedList mb="2">
              <ListItem>
                <Text>
                  <Trans>
                    Requirements:{' '}
                    <Link
                      href="https://www.canada.ca/en/government/system/digital-government/policies-standards/enterprise-it-service-common-configurations/web-sites.html"
                      color="blue.500"
                      isExternal
                    >
                      Web Sites and Services Management Configuration
                      Requirements
                    </Link>
                  </Trans>
                </Text>
              </ListItem>
              <ListItem>
                <Text>
                  <Trans>
                    Implementation:{' '}
                    <Link
                      href="https://cyber.gc.ca/en/guidance/guidance-securely-configuring-network-protocols-itsp40062#a3"
                      color="blue.500"
                      isExternal
                    >
                      Guidance on securely configuring network protocols
                      (ITSP.40.062)
                    </Link>
                  </Trans>
                </Text>
              </ListItem>
            </UnorderedList>
            <Text>
              <Trans>Email Security:</Trans>
            </Text>
            <UnorderedList mb="2">
              <ListItem>
                <Text>
                  <Trans>
                    Requirements:{' '}
                    <Link
                      href="https://www.canada.ca/en/government/system/digital-government/policies-standards/enterprise-it-service-common-configurations/email.html"
                      color="blue.500"
                      isExternal
                    >
                      Email Management Services Configuration Requirements
                    </Link>
                  </Trans>
                </Text>
              </ListItem>
              <ListItem>
                <Text>
                  <Trans>
                    Implementation:{' '}
                    <Link
                      href="https://cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection"
                      color="blue.500"
                      isExternal
                    >
                      Implementation guidance: email domain protection
                      (ITSP.40.065 v1.1)
                    </Link>
                  </Trans>
                </Text>
              </ListItem>
            </UnorderedList>
          </DrawerBody>

          <DrawerFooter>
            <Text>
              <Trans>
                For further guidance on using Tracker and FAQ:{' '}
                <RouteLink to="/guidance">
                  <Text color="blue.500">Read guidance</Text>
                </RouteLink>
              </Trans>
            </Text>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  )
}
