import React, { useState, useEffect } from 'react'
import { useQuery } from '@apollo/react-hooks'
import { Trans } from '@lingui/macro'
import { Layout } from './Layout'
import { ListOf } from './ListOf'
import { Heading, Stack, useToast } from '@chakra-ui/core'
import { ORGANIZATIONS } from './graphql/queries'
import { useUserState } from './UserState'
import { Organization } from './Organization'
import { PaginationButtons } from './PaginationButtons'

export default function Organisations() {
  const { currentUser } = useUserState()
  const [orgs, setOrgs] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [orgsPerPage] = useState(10)
  const toast = useToast()
  // XXX: This component needs pagination
  // This query is currently requesting the first 10 orgs
  const { loading, _error, data } = useQuery(ORGANIZATIONS, {
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
    const fetchOrgs = async () => {
      let organizations = []
      if (data && data.organizations.edges) {
        organizations = data.organizations.edges.map((e) => e.node)
        setOrgs(organizations)
      }
    }
    fetchOrgs()
  }, [data])

  if (loading)
    return (
      <p>
        <Trans>Loading...</Trans>
      </p>
    )

  // Get current orgs
  const indexOfLastOrg = currentPage * orgsPerPage
  const indexOfFirstOrg = indexOfLastOrg - orgsPerPage
  const currentOrgs = orgs.slice(indexOfFirstOrg, indexOfLastOrg)

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  return (
    <Layout>
      <Stack spacing={10} shouldWrapChildren>
        <Heading as="h1">
          <Trans>Organizations</Trans>
        </Heading>
        <Stack direction="row" spacing={4}>
          <Stack spacing={4} flexWrap="wrap">
            <ListOf
              elements={currentOrgs}
              ifEmpty={() => <Trans>No Organizations</Trans>}
            >
              {({ name, slug, domainCount }, index) => (
                <Organization
                  key={'org' + index}
                  slug={slug}
                  name={name}
                  domainCount={domainCount}
                />
              )}
            </ListOf>
          </Stack>
        </Stack>
        {orgs.length > orgsPerPage && (
          <Stack>
            <PaginationButtons
              perPage={orgsPerPage}
              total={orgs.length}
              paginate={paginate}
              currentPage={currentPage}
            />
          </Stack>
        )}
      </Stack>
    </Layout>
  )
}
