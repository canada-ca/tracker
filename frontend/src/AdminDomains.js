import React, { useState } from 'react'
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
  Divider,
  useToast,
} from '@chakra-ui/core'
import { PaginationButtons } from './PaginationButtons'
import { Domain } from './Domain'
import { string, object } from 'prop-types'
import { ListOf } from './ListOf'
import { TrackerButton } from './TrackerButton'

export function AdminDomains({ domainsData, orgName }) {
  let domains = []
  if (domainsData && domainsData.edges) {
    domains = domainsData.edges.map(e => e.node)
  }

  const [domainList, setDomainList] = useState(domains)
  const [currentPage, setCurrentPage] = useState(1)
  const [domainsPerPage] = useState(4)
  const [domainSearch, setDomainSearch] = useState('')
  const toast = useToast()
  const { i18n } = useLingui()

  // Get current domains
  const indexOfLastDomain = currentPage * domainsPerPage
  const indexOfFirstDomain = indexOfLastDomain - domainsPerPage
  const currentDomains = domainList.slice(indexOfFirstDomain, indexOfLastDomain)

  // Change page
  const paginate = pageNumber => setCurrentPage(pageNumber)

  const addDomain = url => {
    if (url !== '') {
      const newDomain = {
        slug: 'new-org-slug',
        url: url,
        lastRan: null,
      }
      setDomainList([...domainList, newDomain])
      setDomainSearch('')
      toast({
        title: 'Domain added',
        description: `${newDomain.url} was added to ${orgName}`,
        status: 'info',
        duration: 9000,
        isClosable: true,
        position: 'bottom-left',
      })
    } else {
      toast({
        title: 'An error occurred.',
        description: 'Search for a domain to add it',
        status: 'error',
        duration: 9000,
        isClosable: true,
        position: 'bottom-left',
      })
    }
  }

  const removeDomain = url => {
    const temp = domainList.filter(d => d.url !== url)

    if (temp) {
      setDomainList(temp)
      if (currentDomains.length <= 1 && domainList.length > 1)
        setCurrentPage(Math.ceil(domainList.length / domainsPerPage) - 1)
      toast({
        title: 'Domain removed',
        description: `${url} was removed from ${orgName}`,
        status: 'info',
        duration: 9000,
        isClosable: true,
        position: 'bottom-left',
      })
    } else {
      toast({
        title: 'An error occurred.',
        description: `${url} could not be removed from ${orgName}`,
        status: 'error',
        duration: 9000,
        isClosable: true,
        position: 'bottom-left',
      })
    }
  }

  return (
    <Stack mb="6" w="100%">
      <Text fontSize="2xl" fontWeight="bold">
        <Trans>Domain List</Trans>
      </Text>
      <SimpleGrid mb="6" columns={{ md: 1, lg: 2 }} spacing="15px">
        <InputGroup>
          <InputLeftElement>
            <Icon name="search" color="gray.300" />
          </InputLeftElement>
          <Input
            type="text"
            placeholder={i18n._(t`Search for a domain`)}
            value={domainSearch}
            onChange={e => {
              setDomainSearch(e.target.value)
            }}
          />
        </InputGroup>
        <TrackerButton
          width={['100%', '80%']}
          onClick={() => {
            addDomain(domainSearch)
          }}
          variant="primary"
        >
          <Icon name="add" />
          <Trans>Add Domain</Trans>
        </TrackerButton>
      </SimpleGrid>
      <Divider />

      <Stack spacing={10} shouldWrapChildren>
        <Stack direction="row" spacing={4}>
          <Stack spacing={4} flexWrap="wrap">
            <ListOf
              elements={currentDomains}
              ifEmpty={() => (
                <Text fontSize="lg" fontWeight="bold">
                  <Trans>No Domains</Trans>
                </Text>
              )}
            >
              {({ url, lastRan }, index) => (
                <Stack key={'admindomain' + index} isInline align="center">
                  <TrackerButton
                    onClick={() => {
                      removeDomain(url)
                    }}
                    variant="danger"
                    px="2"
                    fontSize="xs"
                  >
                    <Icon name="minus" />
                  </TrackerButton>
                  <TrackerButton
                    variant="primary"
                    px="2"
                    fontSize="xs"
                    onClick={() => window.alert('edit domain')}
                  >
                    <Icon name="edit" />
                  </TrackerButton>
                  <Domain url={url} lastRan={lastRan} />
                </Stack>
              )}
            </ListOf>
          </Stack>
        </Stack>
      </Stack>

      {domainList.length > 0 && (
        <PaginationButtons
          perPage={domainsPerPage}
          total={domainList.length}
          paginate={paginate}
          currentPage={currentPage}
        />
      )}
    </Stack>
  )
}

AdminDomains.propTypes = {
  domainsData: object,
  orgName: string,
}
