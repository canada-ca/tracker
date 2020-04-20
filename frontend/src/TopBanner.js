import React from 'react'
import { LocaleSwitcher } from './LocaleSwitcher'
import { useLingui } from '@lingui/react'
import sigEn from './images/goc-signature-block-en.svg'
import sigFr from './images/goc-signature-block-fr.svg'
import { Flex, Box, Image } from '@chakra-ui/core'

export const TopBanner = (props) => {
  const { i18n } = useLingui()

  return (
    <Flex
      maxW={{ sm: 540, md: 768, lg: 960, xl: 1200 }}
      mx="auto"
      px={4}
      w="100%"
      align="center"
      fontFamily="body"
      {...props}
    >
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
  )
}
