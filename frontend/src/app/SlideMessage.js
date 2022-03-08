import React from 'react'

import { useLingui } from '@lingui/react'
import { Trans } from '@lingui/macro'
import sigEn from '../images/goc-header-logo-en.svg'
import sigFr from '../images/goc-header-logo-fr.svg'

import { ArrowBackIcon, ArrowForwardIcon } from '@chakra-ui/icons'
import {
  IconButton,
  Box,
  Text,
  Image,
  Link,
  Divider,
  Flex,
  Slide,
} from '@chakra-ui/react'

import { Link as RouteLink } from 'react-router-dom'
import { bool, func } from 'prop-types'

const emailUrlEn = 'https://www.tbs-sct.gc.ca/pol/doc-eng.aspx?id=27600'
const itpinUrlEn =
  'https://www.canada.ca/en/government/system/digital-government/modern-emerging-technologies/policy-implementation-notices/implementing-https-secure-web-connections-itpin.html'
const emailUrlFr = 'https://www.tbs-sct.gc.ca/pol/doc-fra.aspx?id=27600'
const itpinUrlFr =
  'https://www.canada.ca/fr/gouvernement/systeme/gouvernement-numerique/technologiques-modernes-nouveaux/avis-mise-oeuvre-politique/mise-oeuvre-https-connexions-web-securisees-ampti.html'

export function SlideMessage({ isOpen, onToggle, ...props }) {
  const { i18n } = useLingui()
  return (
    <Flex direction="row" display={{ base: 'none', md: 'inline' }}>
      <Slide direction="left" in={isOpen} style={{ zIndex: 0 }}>
        <Box h="100%" w={isOpen ? '25%' : 0} color="white" bg="black">
          <Box px="8" width={{ base: 272, md: 360 }} mb="33%">
            <Image
              src={i18n.locale === 'en' ? sigEn : sigFr}
              pr="auto"
              py="6"
              minHeight="41px"
              alt={'Symbol of the Government of Canada'}
            />
          </Box>
          <Box px="12">
            <Text fontSize="lg" fontWeight="semibold" color="white">
              <Trans>Track Digital Security</Trans>
            </Text>
            <Divider borderColor="white" my="2" borderTopWidth="1" w="auto" />
            <Text color="white" fontSize="sm">
              <Trans>
                Canadians rely on the Government of Canada to provide secure
                digital services. The Policy on Service and Digital guides
                government online services to adopt good security practices for
                practices outlined in the{' '}
                <Link
                  href={i18n.locale === 'en' ? emailUrlEn : emailUrlFr}
                  isExternal
                  style={{ textDecoration: 'underline', fontWeight: 'bold' }}
                >
                  email
                </Link>{' '}
                and{' '}
                <Link
                  href={i18n.locale === 'en' ? itpinUrlEn : itpinUrlFr}
                  isExternal
                  style={{ textDecoration: 'underline', fontWeight: 'bold' }}
                >
                  web
                </Link>{' '}
                services. Track how government sites are becoming more secure.
              </Trans>
            </Text>
          </Box>
          <Box mt="100%">
            <Flex
              fontSize="sm"
              justifyContent="space-around"
              px="4"
              align="center"
              direction="row"
            >
              <Link
                isExternal={true}
                href={
                  i18n.locale === 'en'
                    ? 'https://www.canada.ca/en/transparency/privacy.html'
                    : 'https://www.canada.ca/fr/transparence/confidentialite.html'
                }
              >
                <Trans>Privacy</Trans>
              </Link>

              <Link as={RouteLink} to="/terms-and-conditions" ml={4}>
                <Trans>Terms & conditions</Trans>
              </Link>

              <Link
                ml={4}
                href={'https://github.com/canada-ca/tracker/issues'}
                isExternal={true}
              >
                <Trans>Report an Issue</Trans>
              </Link>

              <Link as={RouteLink} to="/contact-us" ml={4}>
                <Trans>Contact Us</Trans>
              </Link>
            </Flex>
          </Box>
        </Box>
      </Slide>
      <IconButton
        {...props}
        style={{ zIndex: 1 }}
        aria-label="slide-message"
        icon={isOpen ? <ArrowBackIcon /> : <ArrowForwardIcon />}
        isRound
        onClick={onToggle}
        color="white"
        bgColor="black"
        borderWidth="2px"
        borderColor="white"
        left={isOpen ? '25%' : 0}
        top="50%"
        position="sticky"
        // px="1"
        _hover={{ color: 'accent', borderColor: 'accent', bgColor: 'black' }}
      />
    </Flex>
  )
}

SlideMessage.propTypes = {
  isOpen: bool,
  onToggle: func,
}
