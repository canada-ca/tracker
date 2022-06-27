import React, { useCallback, useState } from 'react'
import { WEBCHECK_ORGS } from '../graphql/queries'
import {
  Accordion,
  AccordionButton,
  AccordionItem,
  AccordionPanel,
  Box,
  Flex,
  Heading,
  Tag,
  TagLabel,
  Text,
} from '@chakra-ui/react'
import { Trans, t } from '@lingui/macro'
import { LoadingMessage } from '../components/LoadingMessage'
import { ErrorFallbackMessage } from '../components/ErrorFallbackMessage'
import { CheckCircleIcon } from '@chakra-ui/icons'
import { ScanDomainButton } from '../domains/ScanDomainButton'
import { useDebouncedFunction } from '../utilities/useDebouncedFunction'
import { usePaginatedCollection } from '../utilities/usePaginatedCollection'
import { ListOf } from '../components/ListOf'
import { SearchBox } from '../components/SearchBox'
import { RelayPaginationControls } from '../components/RelayPaginationControls'

export default function WebCheckPage() {
  const [orderDirection, setOrderDirection] = useState('ASC')
  const [orderField, setOrderField] = useState('NAME')
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [orgsPerPage, setOrgsPerPage] = useState(1)

  const memoizedSetDebouncedSearchTermCallback = useCallback(() => {
    setDebouncedSearchTerm(searchTerm)
  }, [searchTerm])

  useDebouncedFunction(memoizedSetDebouncedSearchTermCallback, 500)

  const {
    loading,
    isLoadingMore,
    error,
    nodes,
    next,
    previous,
    resetToFirstPage,
    hasNextPage,
    hasPreviousPage,
  } = usePaginatedCollection({
    fetchForward: WEBCHECK_ORGS,
    variables: {
      orderBy: {
        field: orderField,
        direction: orderDirection,
      },
      search: debouncedSearchTerm,
    },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
    recordsPerPage: orgsPerPage,
    relayRoot: 'findMyWebCheckOrganizations',
  })

  if (error) return <ErrorFallbackMessage error={error} />

  const orderByOptions = [
    { value: 'NAME', text: t`Name` },
    { value: 'ACRONYM', text: t`Acronym` },
  ]

  const displayTags = (tags) => {
    return (
      <Flex ml="auto">
        {tags.edges.map(({ id, severity }) => {
          return (
            <Tag
              key={id}
              mx="2"
              bg={severity.toLowerCase()}
              borderRadius="full"
              // borderWidth="1px"
              // borderColor="black"
              justifySelf={{ base: 'start', md: 'end' }}
            >
              <TagLabel>{id}</TagLabel>
            </Tag>
          )
        })}
      </Flex>
    )
  }

  let orgList = loading ? (
    <LoadingMessage />
  ) : (
    (orgList = (
      <ListOf
        elements={nodes}
        ifEmpty={() => (
          <Text layerStyle="loadingMessage">
            <Trans>No Organizations</Trans>
          </Text>
        )}
        mb="4"
      >
        {({ id, name, acronym, verified, tags, domains }) => (
          <AccordionItem key={id}>
            <Flex w="100%">
              <AccordionButton
                width="100%"
                p="4"
                alignItems={{ base: 'flex-start', md: 'center' }}
                flexDirection={{ base: 'column', md: 'row' }}
                _hover={{ bg: 'gray.100' }}
                mb="2"
                borderWidth="1px"
                borderColor="black"
                rounded="md"
              >
                <Flex w="100%" textAlign="left">
                  <Text fontWeight="bold">
                    {name} ({acronym}){' '}
                    {verified && (
                      <CheckCircleIcon
                        color="blue.500"
                        size="icons.sm"
                        aria-label="Verified Organization"
                      />
                    )}
                  </Text>
                  {displayTags(tags)}
                </Flex>
              </AccordionButton>
            </Flex>
            {domains.edges.map(({ id, domain, lastRan, tags }) => {
              return (
                <AccordionPanel key={id}>
                  <Flex
                    borderColor="black"
                    borderWidth="1px"
                    rounded="md"
                    align="center"
                    p="4"
                    w="100%"
                  >
                    <Text fontWeight="semibold" mr="1">
                      <Trans>Domain:</Trans>
                    </Text>
                    <Text isTruncated mr="8">
                      {domain}
                    </Text>

                    <Text fontWeight="bold" mr="1">
                      <Trans>Last Scanned:</Trans>
                    </Text>
                    <Text isTruncated>{lastRan}</Text>

                    {displayTags(tags)}
                    <ScanDomainButton domainUrl={domain} ml={4} />
                  </Flex>
                </AccordionPanel>
              )
            })}
          </AccordionItem>
        )}
      </ListOf>
    ))
  )

  return (
    <Box px="4" w="100%">
      <Heading>
        <Trans>Web Check</Trans>
      </Heading>
      <Text fontSize="xl" fontWeight="bold" mb="8">
        <Trans>Vulnerability Scan Dashboard</Trans>
      </Text>
      <SearchBox
        selectedDisplayLimit={orgsPerPage}
        setSelectedDisplayLimit={setOrgsPerPage}
        hasNextPage={hasNextPage}
        hasPreviousPage={hasPreviousPage}
        next={next}
        previous={previous}
        isLoadingMore={isLoadingMore}
        orderDirection={orderDirection}
        setSearchTerm={setSearchTerm}
        setOrderField={setOrderField}
        setOrderDirection={setOrderDirection}
        resetToFirstPage={resetToFirstPage}
        orderByOptions={orderByOptions}
        placeholder={t`Search for a tagged organization`}
      />
      <Accordion allowMultiple defaultIndex={[]}>
        {orgList}
      </Accordion>
      <RelayPaginationControls
        onlyPagination={false}
        selectedDisplayLimit={orgsPerPage}
        setSelectedDisplayLimit={setOrgsPerPage}
        displayLimitOptions={[5, 10, 20, 50, 100]}
        resetToFirstPage={resetToFirstPage}
        hasNextPage={hasNextPage}
        hasPreviousPage={hasPreviousPage}
        next={next}
        previous={previous}
        isLoadingMore={isLoadingMore}
      />
    </Box>
  )
}
