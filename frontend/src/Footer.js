import React from 'react'
import PropTypes from 'prop-types'
import { useLingui } from '@lingui/react'
import wmms from './images/wmms-blk.svg'
import { Box, Flex, List, Image, ListItem } from '@chakra-ui/core'
import { Layout } from './Layout'

export const Footer = props => {
  const { i18n } = useLingui()

  return (
    <Flex as="footer" {...props} py={4} fontFamily="body">
      <Layout>
        <Flex align="center" direction="row">
          <List px={0} d="flex" align="center" direction="row">
            {React.Children.map(props.children, child => (
              <ListItem>{child}</ListItem>
            ))}
          </List>
          <Box py={4} width={{ base: 147.2 }} ml="auto">
            <Image
              src={wmms}
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
    </Flex>
  )
}

Footer.propTypes = {
  children: PropTypes.any,
  bg: PropTypes.string,
}

Footer.defaultProps = { bg: 'gray.200' }
