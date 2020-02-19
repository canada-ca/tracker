import React from 'react'
import PropTypes from 'prop-types'
import { LocaleSwitcher } from './LocaleSwitcher'
import { useLingui } from '@lingui/react'
import sigEn from './images/sig-blk-en.svg'
import sigFr from './images/sig-blk-fr.svg'
import { Flex, Box, Image } from '@chakra-ui/core'
import { Layout } from './Layout'

export const TopBanner = props => {
  const { i18n } = useLingui()

  return (
    <Flex {...props}>
      <Layout>
        <Flex align="center" fontFamily="body">
          <Box py={4} width={{ base: 272, md: 360 }}>
            <Image
              src={i18n.locale === 'en' ? sigEn : sigFr}
              width="100%"
              alt={i18n._('Symbol of the Government of Canada')}
            />
          </Box>
          <Box py={4} pl={4} ml="auto">
            <LocaleSwitcher />
          </Box>
        </Flex>
      </Layout>
    </Flex>
  )
}

TopBanner.propTypes = {
  lang: PropTypes.string.isRequired,
  bg: PropTypes.string,
}

TopBanner.defaultProps = {
  bg: 'gray.50',
}
