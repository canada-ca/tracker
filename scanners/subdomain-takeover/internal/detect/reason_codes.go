package detect

type ReasonCode string

const (
	ReasonCNAMEDanglingNXDOMAIN             ReasonCode = "CNAME_DANGLING_NXDOMAIN"
	ReasonCNAMEProviderFingerprintBodyMatch ReasonCode = "CNAME_PROVIDER_FINGERPRINT_BODY_MATCH"
	ReasonCNAMETargetMatchMissingNXDOMAIN   ReasonCode = "CNAME_TARGET_MATCH_MISSING_NXDOMAIN"
	ReasonCNAMETargetMatchMissingBodyFP     ReasonCode = "CNAME_TARGET_MATCH_MISSING_BODY_FINGERPRINT"

	ReasonNSFullLameProviderVulnerable    ReasonCode = "NS_FULL_LAME_PROVIDER_VULNERABLE"
	ReasonNSPartialLameProviderVulnerable ReasonCode = "NS_PARTIAL_LAME_PROVIDER_VULNERABLE"
	ReasonNSLameProviderUnknown           ReasonCode = "NS_LAME_PROVIDER_UNKNOWN"
	ReasonNSProviderMatchOnly             ReasonCode = "NS_PROVIDER_MATCH_ONLY"
)
