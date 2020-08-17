import React from 'react'
import { LocaleSwitcher } from './LocaleSwitcher'
import { useLingui } from '@lingui/react'
import sigEn from './images/goc-header-logo-en.svg'
import sigFr from './images/goc-header-logo-fr.svg'
import { Flex, Box, Image } from '@chakra-ui/core'
import { Layout } from './Layout'

export const TopBanner = props => {
  const { i18n } = useLingui()

  return (
    <Flex bg="primary"  borderBottom="3px solid" borderBottomColor="accent">
      <Layout>
        <Flex
          maxW={{ sm: 540, md: 768, lg: 960, xl: 1200 }}
          mx="auto"
          w="100%"
          align="center"
          fontFamily="body"
          {...props}
        > 
          <Box py="4" width={{ base: 272, md: 360 }}>
            <Image
              src={i18n.locale === 'en' ? sigEn : sigFr}
              pr={16}
              py={2}
              minHeight="41px"
              alt={i18n._('Symbol of the Government of Canada')}
            />
          </Box>
          <Box py={4} pl={0} pr={4} ml="auto">
            <LocaleSwitcher/>
          </Box>
        </Flex>
      </Layout>
    </Flex>
  )
}
