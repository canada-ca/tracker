import { gql } from '@apollo/client'

export const DKIM_SCAN_DATA = gql`
  subscription DkimScanData {
    dkimScanData {
      sharedId
      domain {
        domain
      }
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
      record
      pPolicy
      spPolicy
      pct
      negativeGuidanceTag {
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
