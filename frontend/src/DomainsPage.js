import React, { useEffect, useState } from 'react'
import { useQuery } from '@apollo/react-hooks'
import { Trans } from '@lingui/macro'
import { Layout } from './Layout'
import { Heading, Stack, useToast, Text } from '@chakra-ui/core'
import { DOMAINS } from './graphql/queries'
import { useUserState } from './UserState'
import { Domain } from './Domain'
import { DomainList } from './DomainList'
import { PaginationButtons } from './PaginationButtons'

export default function DomainsPage() {
  const { currentUser } = useUserState()
  const [domains, setDomains] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [domainsPerPage] = useState(10)
  const toast = useToast()
  const { loading, _error, data } = useQuery(DOMAINS, {
    context: {
      headers: {
        authorization: currentUser.jwt,
      },
    },
    onError: (error) => {
      const [_, message] = error.message.split(': ')
      toast({
        title: 'Error',
        description: message,
        status: 'failure',
        duration: 9000,
        isClosable: true,
      })
    },
  })

  useEffect(() => {
    const fetchDomains = async () => {
      let domainsData = []
      if (data && data.domains.edges) {
        domainsData = data.domains.edges.map((e) => e.node)
        setDomains(domainsData)
      }
    }
    fetchDomains()
  }, [data])

  if (loading)
    return (
      <p>
        <Trans>Loading...</Trans>
      </p>
    )

  // Get current domains
  const indexOfLastDomain = currentPage * domainsPerPage
  const indexOfFirstDomain = indexOfLastDomain - domainsPerPage
  const currentDomains = domains.slice(indexOfFirstDomain, indexOfLastDomain)

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  return (
    <Layout>
      <Stack spacing={10} shouldWrapChildren>
        <Heading as="h1">
          <Trans>Domains</Trans>
        </Heading>
        {data && data.domains && (
          <Stack spacing={4}>
            <Stack spacing={4} direction="row" flexWrap="wrap">
              <DomainList domains={currentDomains}>
                {(domain) => (
                  <Domain
                    key={domain.url}
                    url={domain.url}
                    lastRan={domain.lastRan}
                  />
                )}
              </DomainList>
            </Stack>
            {domains.length > domainsPerPage && (
              <Stack>
                <PaginationButtons
                  perPage={domainsPerPage}
                  total={domains.length}
                  paginate={paginate}
                  currentPage={currentPage}
                />
              </Stack>
            )}
          </Stack>
        )}
      </Stack>
    </Layout>
  )
}
