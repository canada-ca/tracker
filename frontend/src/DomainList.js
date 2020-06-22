import React from 'react'
import { Trans, t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import {
  Text,
  Stack,
  SimpleGrid,
  InputGroup,
  InputLeftElement,
  Icon,
  Input,
  Button,
  Divider,
  IconButton,
  useToast,
} from '@chakra-ui/core'
import { PaginationButtons } from './PaginationButtons'
import { Domain } from './Domain'
import { string, arrayOf, shape, object } from 'prop-types'

export function DomainList({ ...props }) {
  const { data, orgName } = props
  const [domainList, setDomainList] = React.useState(data.domains.edges)
  const [domainSearch, setDomainSearch] = React.useState('')
  const toast = useToast()
  const { i18n } = useLingui()

  const addDomain = (url) => {
    if (url !== '') {
      const newDomain = {
        node: {
          slug: 'new-org-slug',
          url: url,
          lastRan: null,
        },
      }
      setDomainList([...domainList, newDomain])
      setDomainSearch('')
      toast({
        title: 'User added',
        description: `${newDomain.node.url} was added to ${orgName}`,
        status: 'info',
        duration: 9000,
        isClosable: true,
      })
    } else {
      toast({
        title: 'An error occurred.',
        description: 'Search for a domain to add it',
        status: 'error',
        duration: 9000,
        isClosable: true,
      })
    }
  }

  const removeDomain = (domain) => {
    const temp = domainList.filter((d) => d.node.url !== domain.url)

    if (temp) {
      setDomainList(temp)
      toast({
        title: 'User removed',
        description: `${domain.url} was removed from ${orgName}`,
        status: 'info',
        duration: 9000,
        isClosable: true,
      })
    } else {
      toast({
        title: 'User removal failed',
        description: `${domain.url} could not be removed from ${orgName}`,
        status: 'error',
        duration: 9000,
        isClosable: true,
      })
    }
  }

  return (
    <Stack mb={6} w="100%">
      <Text fontSize="2xl" fontWeight="bold">
        <Trans>Domain List</Trans>
      </Text>
      <SimpleGrid mb={6} columns={{ md: 1, lg: 2 }} spacing="15px">
        <InputGroup>
          <InputLeftElement>
            <Icon name="search" color="gray.300" />
          </InputLeftElement>
          <Input
            type="text"
            placeholder={i18n._(t`Search for a domain`)}
            value={domainSearch}
            onChange={(e) => {
              setDomainSearch(e.target.value)
            }}
          />
        </InputGroup>
        <Button
          width={'100%'}
          leftIcon="add"
          variantColor="blue"
          onClick={() => {
            addDomain(domainSearch)
          }}
        >
          <Trans>Add Domain</Trans>
        </Button>
      </SimpleGrid>
      <Divider />

      {!domainList || domainList.length === 0 ? (
        <Text fontSize="2xl" fontWeight="bold" textAlign={['center']}>
          <Trans>No domains scanned yet</Trans>
        </Text>
      ) : (
        domainList.map(({ node }) => {
          return (
            <Stack isInline key={node.url} align="center">
              <IconButton
                size="xs"
                variantColor="red"
                icon="minus"
                onClick={() => {
                  removeDomain(node)
                }}
              />
              <IconButton
                size="xs"
                icon="edit"
                variantColor="blue"
                onClick={() => window.alert('edit domain')}
              />

              <Domain url={node.url} lastRan={null} />
            </Stack>
          )
        })
      )}
      <Divider />
      <PaginationButtons
        next={data.domains.pageInfo.hasNextPage}
        previous={false}
      />
    </Stack>
  )
}

DomainList.propTypes = {
  data: shape({
    domains: shape({
      edges: arrayOf(
        shape({
          node: shape({ organization: object, url: string, lastRan: string }),
        }),
      ),
    }),
  }),
  orgName: string,
}

// export function DomainList({ domains = [], ...props }) {
//   const elements = []
//   if (!domains || (domains && domains.length === 0)) {
//     return (
//       <List {...props}>
//         <ListItem key={'no-domains-scanned'}>
//           <Trans>No domains scanned yet.</Trans>
//         </ListItem>
//       </List>
//     )
//   } else {
//     for (const domain of domains) {
//       elements.push(props.children(domain))
//     }
//     return <List {...props}>{elements}</List>
//   }
// }

// DomainList.propTypes = {
//   children: func,
//   domains: arrayOf(
//     shape({ node: shape({ organization: object, url: string, lastRan: string }) }),
//   ),
// }
