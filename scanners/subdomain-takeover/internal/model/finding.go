package model

type RecordType string

const (
	RecordTypeCNAME RecordType = "CNAME"
	RecordTypeNS    RecordType = "NS"
)

type Finding struct {
	Domain     string     `json:"domain"`
	DomainKey  string     `json:"domain_key"`
	RecordType RecordType `json:"record_type"`
	Target     string     `json:"target"`
	Provider   string     `json:"provider"`
	LameType   string     `json:"lame_type"`
	Confidence string     `json:"confidence"`
	ReasonCode string     `json:"reason_code"`
}
