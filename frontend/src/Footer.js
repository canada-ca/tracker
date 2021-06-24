import React from 'react'
import PropTypes from 'prop-types'
import { useLingui } from '@lingui/react'
import wordmark from './images/canada-wordmark.svg'
import { Box, Flex, Image, List, ListItem } from '@chakra-ui/core'

export const Footer = (props) => {
  const { i18n } = useLingui()
  const smallDevice = window.matchMedia('(max-width: 500px)').matches

  return (
    <Flex
      {...props}
      py="4"
      fontFamily="body"
      borderTop="2px solid"
      borderTopColor="gray.300"
    >
      <Flex
        maxW={{ sm: 540, md: 768, lg: 960, xl: 1200 }}
        mx="auto"
        px={4}
        w="100%"
        align="center"
        direction="row"
      >
        <List px={0} d="flex" align="center" direction="row">
          {React.Children.map(props.children, (child) => (
            <ListItem>{child}</ListItem>
          ))}
        </List>
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
    </Flex>
  )
}

Footer.propTypes = {
  children: PropTypes.any,
  bg: PropTypes.string,
}

Footer.defaultProps = { bg: 'gray.200' }
