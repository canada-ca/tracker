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
import { string, object } from 'prop-types'
import { ListOf } from './ListOf'

export function AdminDomains({ ...props }) {
  const { domainsData, orgName } = props

  let domains = []
  if (domainsData && domainsData.domains.edges) {
    domains = domainsData.domains.edges.map((e) => e.node)
  }

  const [domainList, setDomainList] = React.useState(domains)
  const [domainSearch, setDomainSearch] = React.useState('')
  const toast = useToast()
  const { i18n } = useLingui()

  const addDomain = (url) => {
    if (url !== '') {
      const newDomain = {
        slug: 'new-org-slug',
        url: url,
        lastRan: null,
      }
      setDomainList([...domainList, newDomain])
      setDomainSearch('')
      toast({
        title: 'User added',
        description: `${newDomain.url} was added to ${orgName}`,
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

  const removeDomain = (url) => {
    const temp = domainList.filter((d) => d.url !== url)

    if (temp) {
      setDomainList(temp)
      toast({
        title: 'User removed',
        description: `${url} was removed from ${orgName}`,
        status: 'info',
        duration: 9000,
        isClosable: true,
      })
    } else {
      toast({
        title: 'User removal failed',
        description: `${url} could not be removed from ${orgName}`,
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

      <Stack spacing={10} shouldWrapChildren>
        <Stack direction="row" spacing={4}>
          <Stack spacing={4} flexWrap="wrap">
            <ListOf
              elements={domainList}
              ifEmpty={() => (
                <Text fontSize="lg" fontWeight="bold">
                  <Trans>No Domains</Trans>
                </Text>
              )}
            >
              {({ url, lastRan }) => (
                <Stack isInline align="center">
                  <IconButton
                    size="xs"
                    variantColor="red"
                    icon="minus"
                    onClick={() => {
                      removeDomain(url)
                    }}
                  />
                  <IconButton
                    size="xs"
                    icon="edit"
                    variantColor="blue"
                    onClick={() => window.alert('edit domain')}
                  />
                  <Domain url={url} lastRan={lastRan} />
                </Stack>
              )}
            </ListOf>
          </Stack>
        </Stack>
      </Stack>

      <Divider />
      <PaginationButtons next={false} previous={false} />
    </Stack>
  )
}

AdminDomains.propTypes = {
  domainsData: object,
  orgName: string,
}
