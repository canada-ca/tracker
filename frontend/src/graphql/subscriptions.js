import { gql } from '@apollo/client'

export const DKIM_SCAN_DATA = gql`
  subscription DkimScanData {
    dkimScanData {
      results {
        selector
        record
        keyLength
        rawJson
      }
    }
  }
`
