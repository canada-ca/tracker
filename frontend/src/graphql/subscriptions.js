import { gql } from '@apollo/client'

export const DKIM_SCAN_DATA = gql`
  subscription DkimScanData {
    dkimScanData {
      sharedId
      domain {
        domain
      }
      status
      results {
        selector
        record
        keyLength
        negativeGuidanceTags {
          tagId
          tagName
          guidance
          refLinks {
            description
            refLink
          }
          refLinksTech {
            description
            refLink
          }
        }

        neutralGuidanceTags {
          tagId
          tagName
          guidance
          refLinks {
            description
            refLink
          }
          refLinksTech {
            description
            refLink
          }
        }
        positiveGuidanceTags {
          tagId
          tagName
          guidance
          refLinks {
            description
            refLink
          }
          refLinksTech {
            description
            refLink
          }
        }
      }
    }
  }
`

export const DMARC_SCAN_DATA = gql`
  subscription DmarcScanData {
    dmarcScanData {
      sharedId
      domain {
        domain
      }
      status
      dmarcPhase
      record
      pPolicy
      spPolicy
      pct
      negativeGuidanceTags {
        tagId
        tagName
        guidance
        refLinks {
          description
          refLink
        }
        refLinksTech {
          description
          refLink
        }
      }
      neutralGuidanceTags {
        tagId
        tagName
        guidance
        refLinks {
          description
          refLink
        }
        refLinksTech {
          description
          refLink
        }
      }
      positiveGuidanceTags {
        tagId
        tagName
        guidance
        refLinks {
          description
          refLink
        }
        refLinksTech {
          description
          refLink
        }
      }
    }
  }
`

export const SPF_SCAN_DATA = gql`
  subscription SpfScanData {
    spfScanData {
      sharedId
      domain {
        domain
      }
      status
      lookups
      record
      spfDefault
      negativeGuidanceTags {
        tagId
        tagName
        guidance
        refLinks {
          description
          refLink
        }
        refLinksTech {
          description
          refLink
        }
      }
      neutralGuidanceTags {
        tagId
        tagName
        guidance
        refLinks {
          description
          refLink
        }
        refLinksTech {
          description
          refLink
        }
      }

      positiveGuidanceTags {
        tagId
        tagName
        guidance
        refLinks {
          description
          refLink
        }
        refLinksTech {
          description
          refLink
        }
      }
    }
  }
`

export const HTTPS_SCAN_DATA = gql`
  subscription HttpsScanData {
    httpsScanData {
      sharedId
      domain {
        domain
      }
      status
      implementation
      enforced
      hsts
      hstsAge
      preloaded
      negativeGuidanceTags {
        tagId
        tagName
        guidance
        refLinks {
          description
          refLink
        }
        refLinksTech {
          description
          refLink
        }
      }
      neutralGuidanceTags {
        tagId
        tagName
        guidance
        refLinks {
          description
          refLink
        }
        refLinksTech {
          description
          refLink
        }
      }
      positiveGuidanceTags {
        tagId
        tagName
        guidance
        refLinks {
          description
          refLink
        }
        refLinksTech {
          description
          refLink
        }
      }
    }
  }
`

export const SSL_SCAN_DATA = gql`
  subscription SslScanData {
    sslScanData {
      sharedId
      domain {
        domain
      }
      status
      acceptableCiphers
      acceptableCurves
      ccsInjectionVulnerable
      heartbleedVulnerable
      strongCiphers
      strongCurves
      supportsEcdhKeyExchange
      weakCiphers
      weakCurves
      negativeGuidanceTags {
        tagId
        tagName
        guidance
        refLinks {
          description
          refLink
        }
        refLinksTech {
          description
          refLink
        }
      }
      neutralGuidanceTags {
        tagId
        tagName
        guidance
        refLinks {
          description
          refLink
        }
        refLinksTech {
          description
          refLink
        }
      }
      positiveGuidanceTags {
        tagId
        tagName
        guidance
        refLinks {
          description
          refLink
        }
        refLinksTech {
          description
          refLink
        }
      }
    }
  }
`
