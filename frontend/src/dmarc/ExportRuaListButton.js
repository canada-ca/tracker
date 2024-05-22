import React, { useCallback } from 'react'
import { Button, useToast } from '@chakra-ui/react'
import { Trans, t } from '@lingui/macro'
import { useLazyQuery } from '@apollo/client'
import { GET_ALL_VERIFIED_RUA_DOMAINS as EXPORT } from '../graphql/queries'

export function ExportRuaListButton(props) {
  const toast = useToast()
  const [getData, { loading, error }] = useLazyQuery(EXPORT)
  const date = new Date().toLocaleDateString()

  const download = useCallback(async () => {
    toast({
      title: t`Getting domain statuses`,
      description: t`Request successfully sent to get all domain statuses - this may take a minute.`,
      status: 'info',
      duration: 9000,
      isClosable: true,
      position: 'top-left',
    })

    let a
    try {
      const result = await getData()
      if (result?.data?.allVerifiedRUA === null) {
        toast({
          title: t`No data found`,
          description: t`No data was found to export.`,
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
        throw t`No data found`
      }

      a = document.createElement('a')
      a.href = 'data:text/json;charset=utf-8,' + encodeURI(result?.data?.getAllVerifiedRuaDomains)
      a.download = `tracker_verified_rua_domains_${date}.json`
      document.body.appendChild(a)
      a.click()
    } catch (err) {
      console.log(err)
    } finally {
      if (a) {
        document.body.removeChild(a)
      }
    }
  }, [getData, toast, date])

  if (error) {
    console.error(error)
    return null
  }

  return (
    <Button {...props} variant="primary" onClick={download} isLoading={loading}>
      <Trans>Export RUA List</Trans>
    </Button>
  )
}
