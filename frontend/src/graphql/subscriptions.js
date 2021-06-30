import { gql } from '@apollo/client'

export const DKIM_SCAN_DATA = gql`
  subscription DkimScanData {
    dkimScanData {
      results {
        domain {
          domain
        }
        selector
        record
        keyLength
      }
    }
  }
`

export const DMARC_SCAN_DATA = gql`
  subscription DmarcScanData {
    dmarcScanData {
      domain {
        domain
      }
      timestamp
      record
      pPolicy
      spPolicy
      pct
    }
  }
`

export const SPF_SCAN_DATA = gql`
  subscription SpfScanData {
    spfScanData {
      domain {
        domain
      }
      lookups
      record
      spfDefault
    }
  }
`

export const HTTPS_SCAN_DATA = gql`
  subscription HttpsScanData {
    httpsScanData {
      domain {
        domain
      }
      implementation
      enforced
      hsts
      hstsAge
      preloaded
    }
  }
`

export const SSL_SCAN_DATA = gql`
  subscription SslScanData {
    sslScanData {
      domain {
        domain
      }
      acceptableCiphers
      acceptableCurves
      ccsInjectionVulnerable
      heartbleedVulnerable
      strongCiphers
      strongCurves
      supportsEcdhKeyExchange
      weakCiphers
      weakCurves
    }
  }
`
