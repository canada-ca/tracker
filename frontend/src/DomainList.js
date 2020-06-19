import React from 'react'
import { Trans } from '@lingui/macro'
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
  // console.log(domainList)

  const newDomain = (url) => {
    return {
      node: {
        slug: 'org-slug-bois',
        url: url,
        lastRan: null,
      },
    }
  }

  const removeDomain = (domain) => {
    const temp = domainList
    let index = -1
    for (var i = 0; i < temp.length; i++) {
      if (temp[i].node.url === domain.url) {
        index = i
      }
    }

    if (index > -1) {
      temp.splice(index, 1)
      setDomainList(temp)
      toast({
        title: 'Domain removed',
        description: `${domain.url} was successfully removed from ${orgName}`,
        status: 'success',
        duration: 9000,
        isClosable: true,
      })
    } else {
      toast({
        title: 'Domain removal failed',
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
        Domain List
      </Text>
      <SimpleGrid mb={6} columns={{ md: 1, lg: 2 }} spacing="15px">
        <InputGroup>
          <InputLeftElement>
            <Icon name="search" color="gray.300" />
          </InputLeftElement>
          <Input
            type="text"
            placeholder="Search for domain"
            value={domainSearch}
            onChange={(e) => {
              setDomainSearch(e.target.value)
            }}
          />
        </InputGroup>
        <Button
          width={'70%'}
          leftIcon="add"
          variantColor="blue"
          onClick={() => {
            domainSearch !== ''
              ? setDomainList([...domainList, newDomain(domainSearch)])
              : toast({
                  title: 'An error occurred.',
                  description: 'Search for a domain to add it',
                  status: 'error',
                  duration: 9000,
                  isClosable: true,
                })
            setDomainSearch('')
          }}
        >
          <Trans>Add Domain</Trans>
        </Button>
      </SimpleGrid>
      <Divider />

      {domainList.length === 0 ? (
        <Text fontSize="2xl" fontWeight="bold" textAlign={['center']}>
          No domains scanned yet
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
