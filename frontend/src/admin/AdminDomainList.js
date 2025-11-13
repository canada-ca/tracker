import React from 'react'
import { Divider, Flex, IconButton, Stack, Text } from '@chakra-ui/react'
import { ListOf } from '../components/ListOf'
import { Trans } from '@lingui/macro'
import { EditIcon, MinusIcon } from '@chakra-ui/icons'
import { AdminDomainCard } from './AdminDomainCard'
import { ABTestVariant, ABTestWrapper } from '../app/ABTestWrapper'
import SubdomainDiscoveryButton from '../domains/SubdomainDiscoveryButton'
import { array, bool, func, object, string } from 'prop-types'

export function AdminDomainList({
  nodes,
  verified,
  permission,
  orgId,
  orgSlug,
  i18n,
  setSelectedRemoveProps,
  removeOnOpen,
  setModalProps,
  updateOnOpen,
}) {
  return (
    <ListOf
      elements={nodes}
      ifEmpty={() => (
        <Text layerStyle="loadingMessage">
          <Trans>No Domains</Trans>
        </Text>
      )}
    >
      {({ id: domainId, domain, claimTags, archived, rcode, organizations, assetState }, index) => (
        <React.Fragment key={`admindomain-${index}`}>
          {index === 0 && <Divider borderBottomColor="gray.400" />}
          <Flex p="1" align="center" rounded="md" mb="1">
            <Stack direction="row" flexGrow="0" mr="2">
              {(!verified || permission === 'SUPER_ADMIN' || rcode === 'NXDOMAIN') && (
                <IconButton
                  data-testid={`remove-${index}`}
                  onClick={() => {
                    setSelectedRemoveProps({ domain, domainId, rcode })
                    removeOnOpen()
                  }}
                  variant="danger"
                  px="2"
                  icon={<MinusIcon />}
                  aria-label={'Remove ' + domain}
                />
              )}
              <IconButton
                data-testid={`edit-${index}`}
                variant="primary"
                px="2"
                onClick={() => {
                  setModalProps({
                    archived,
                    mutation: 'update',
                    assetState,
                    tagInputList: claimTags,
                    editingDomainId: domainId,
                    editingDomainUrl: domain,
                    orgCount: organizations.totalCount,
                  })
                  updateOnOpen()
                }}
                icon={<EditIcon />}
                aria-label={'Edit ' + domain}
              />
            </Stack>
            <AdminDomainCard
              url={domain}
              tags={claimTags}
              assetState={assetState}
              isArchived={archived}
              rcode={rcode}
              locale={i18n.locale}
              flexGrow={1}
              fontSize={{ base: '75%', sm: '100%' }}
            />
            <ABTestWrapper>
              <ABTestVariant name="B">
                <SubdomainDiscoveryButton domainUrl={domain} orgId={orgId} orgSlug={orgSlug} ml="2" />
              </ABTestVariant>
            </ABTestWrapper>
          </Flex>
          <Divider borderBottomColor="gray.400" />
        </React.Fragment>
      )}
    </ListOf>
  )
}
AdminDomainList.propTypes = {
  nodes: array.isRequired,
  verified: bool,
  permission: string,
  orgId: string.isRequired,
  orgSlug: string,
  i18n: object.isRequired,
  setSelectedRemoveProps: func.isRequired,
  removeOnOpen: func.isRequired,
  setModalProps: func.isRequired,
  updateOnOpen: func.isRequired,
}
