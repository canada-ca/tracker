import React, { useEffect, useState } from 'react'
import { Trans, t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import {
  Stack,
  Text,
  SimpleGrid,
  InputGroup,
  InputLeftElement,
  Icon,
  Input,
  useToast,
  Divider,
} from '@chakra-ui/core'
import { PaginationButtons } from './PaginationButtons'
import { Domain } from './Domain'
import { string, object } from 'prop-types'
import { ListOf } from './ListOf'
import { TrackerButton } from './TrackerButton'
import { useMutation } from '@apollo/client'
import { CREATE_DOMAIN } from './graphql/mutations'
import { slugify } from './slugify'
import { useUserState } from './UserState'
import { EditDomainButton } from './EditDomainButton'
import { RemoveDomainButton } from './RemoveDomainButton'

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
  const { currentUser } = useUserState()

  // Get current domains
  const indexOfLastDomain = currentPage * domainsPerPage
  const indexOfFirstDomain = indexOfLastDomain - domainsPerPage
  const currentDomains = domainList.slice(indexOfFirstDomain, indexOfLastDomain)

  // Change page
  const paginate = pageNumber => setCurrentPage(pageNumber)

  // Update domains list if domainsData changes (domain added, removed, updated)
  useEffect(() => {
    setDomainList(domains)
  }, [domainsData])

  // Set current page to last page when current page > total number of pages
  // (avoids "Page 17 of 16" for example)
  useEffect(() => {
    const totalDomainPages = Math.ceil(domainList.length / domainsPerPage)
    if (currentPage > totalDomainPages) {
      paginate(totalDomainPages)
    }
  }, [domainList])

  const [createDomain] = useMutation(CREATE_DOMAIN, {
    refetchQueries: ['Domains'],
    context: {
      headers: {
        authorization: currentUser.jwt,
      },
    },
    onError(error) {
      toast({
        title: i18n._(t`An error occurred.`),
        description: error.message,
        status: 'error',
        duration: 9000,
        isClosable: true,
        position: 'bottom-left',
      })
    },
    onCompleted() {
      toast({
        title: i18n._(t`Domain added`),
        description: i18n._(t`Domain was added to ${orgName}`),
        status: 'info',
        duration: 9000,
        isClosable: true,
        position: 'bottom-left',
      })
      setDomainSearch('')
    },
  })

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
            if (!domainSearch) {
              toast({
                title: i18n._(t`An error occurred.`),
                description: i18n._(t`New domain name cannot be empty`),
                status: 'error',
                duration: 9000,
                isClosable: true,
                position: 'bottom-left',
              })
            } else {
              createDomain({
                variables: {
                  orgSlug: slugify(orgName),
                  url: domainSearch,
                  selectors: [],
                },
              })
            }
          }}
          variant="primary"
        >
          <Icon name="add" />
          <Trans>Add Domain</Trans>
        </TrackerButton>
      </SimpleGrid>

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
                  <RemoveDomainButton url={url} orgName={orgName} />
                  <Divider />
                  <EditDomainButton url={url} orgName={orgName} />
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
