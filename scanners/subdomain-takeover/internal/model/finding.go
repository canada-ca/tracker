package model

type Finding struct {
	Domain      string `json:"domain"`
	DomainKey   string `json:"domain_key"`
	RecordType  string `json:"record_type"`
	Target      string `json:"target"`
	Provider    string `json:"provider"`
	LameType    string `json:"lame_type"`
	Confidence  string `json:"confidence"`
	ReasonCode  string `json:"reason_code"`
	Remediation string `json:"remediation"`
}
