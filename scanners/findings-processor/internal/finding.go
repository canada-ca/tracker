package model

type FindingEvent struct {
	SchemaVersion string         `json:"schemaVersion"`
	Source        string         `json:"source"`
	FindingType   string         `json:"findingType"`
	DomainKey     string         `json:"domainKey"`
	Subject       string         `json:"subject"`
	Confidence    string         `json:"confidence"`
	Severity      string         `json:"severity,omitempty"`
	ReasonCode    string         `json:"reasonCode,omitempty"`
	ObservedAt    string         `json:"observedAt"`
	Evidence      map[string]any `json:"evidence,omitempty"`
	Attributes    map[string]any `json:"attributes,omitempty"`
}

func (FindingEvent) GetKey() string {
	return ""
}

func (FindingEvent) SetIncrement() {

}
