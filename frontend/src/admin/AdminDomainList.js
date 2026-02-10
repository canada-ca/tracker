import React from 'react'
import { IconButton, Text } from '@chakra-ui/react'
import { ListOf } from '../components/ListOf'
import { Trans } from '@lingui/macro'
import { EditIcon, MinusIcon } from '@chakra-ui/icons'
import { AdminDomainCard } from './AdminDomainCard'
import { array, bool, func, object, string } from 'prop-types'

export function AdminDomainList({
  nodes,
  verified,
  permission,
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
      {({ id: domainId, domain, claimTags, archived, rcode, organizations, assetState, cvdEnrolled }, index) => (
        <React.Fragment key={`admindomain-${index}`}>
          <AdminDomainCard
            url={domain}
            tags={claimTags}
            assetState={assetState}
            isArchived={archived}
            rcode={rcode}
            cvdEnrolled={cvdEnrolled}
            locale={i18n.locale}
            flexGrow={1}
            fontSize={{ base: '75%', sm: '100%' }}
          >
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
                mr="1"
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
              mr="2"
            />
          </AdminDomainCard>
        </React.Fragment>
      )}
    </ListOf>
  )
}
AdminDomainList.propTypes = {
  nodes: array.isRequired,
  verified: bool,
  permission: string,
  i18n: object.isRequired,
  setSelectedRemoveProps: func.isRequired,
  removeOnOpen: func.isRequired,
  setModalProps: func.isRequired,
  updateOnOpen: func.isRequired,
}
