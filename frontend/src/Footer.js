import React from 'react'
import PropTypes from 'prop-types'
import { useLingui } from '@lingui/react'
import wordmark from './images/canada-wordmark.svg'
import { Box, Flex, Image } from '@chakra-ui/react'
import { Layout } from './Layout'

export const Footer = ({ children, ...props }) => {
  const { i18n } = useLingui()
  const smallDevice = window.matchMedia('(max-width: 500px)').matches

  return (
    <Layout
      borderTop="2px solid"
      borderTopColor="gray.300"
      bg="gray.200"
      {...props}
    >
      <Flex py={4} align="center" direction="row" fontFamily="body">
        {children}
        {!smallDevice && (
          <Box py={4} width={{ base: 147.2 }} ml="auto">
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
        )}
      </Flex>
    </Layout>
  )
}

Footer.propTypes = {
  children: PropTypes.any,
}
