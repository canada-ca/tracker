import React from 'react'
import PropTypes from 'prop-types'
import { useLingui } from '@lingui/react'
import { Box, Flex, Image } from '@chakra-ui/react'

import { Layout } from '../components/Layout'
import wordmark from '../images/canada-wordmark.svg'

export const Footer = ({ children, ...props }) => {
  const { i18n } = useLingui()

  return (
    <Layout {...props}>
      <Flex mx="auto" py={4} align="center" direction="row">
        {children}
        <Box
          py={4}
          width={{ base: 147.2 }}
          ml="auto"
          display={{ base: 'none', md: 'initial' }}
        >
          <Image
            src={wordmark}
            width="100%"
            alt={
              i18n.locale === 'en'
                ? 'Symbol of the Government of Canada'
                : 'Symbole du gouvernement du Canada'
            }
          />
        </Box>
      </Flex>
    </Layout>
  )
}

Footer.propTypes = {
  children: PropTypes.any,
}
