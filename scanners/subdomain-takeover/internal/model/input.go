package model

type Input struct {
	Domain        string        `json:"domain"`
	BaseDomain    string        `json:"base_domain"`
	ZoneApex      string        `json:"zone_apex"`
	RecordExists  bool          `json:"record_exists"`
	Rcode         string        `json:"rcode"`
	ResolveChain  [][]string    `json:"resolve_chain"`
	CnameRecord   *string       `json:"cname_record"`
	NsRecords     NsRecords     `json:"ns_records"`
	QueryAnswers  QueryAnswers  `json:"query_res"`
	NsDelegations NsDelegations `json:"ns_delegations"`
}

type NsRecords struct {
	Hostnames []string `json:"hostnames"`
	Warnings  []string `json:"warnings"`
}

type QueryAnswers struct {
	A     string `json:"A"`
	SOA   string `json:"SOA"`
	NS    string `json:"NS"`
	CNAME string `json:"CNAME"`
}

type NsDelegations struct {
	Hosts      []string   `json:"ns_hosts"`
	Checks     []NsCheck  `json:"ns_checks"`
	Delegation Delegation `json:"ns_delegation"`
}

type NsCheck struct {
	Host                    string  `json:"ns_host"`
	Qname                   string  `json:"qname"`
	Qtype                   string  `json:"qtype"`
	Rcode                   string  `json:"rcode"`
	AnsweredAuthoritatively bool    `json:"answered_authoritatively"`
	Error                   *string `json:"error"`
	Timeout                 bool    `json:"timeout"`
}
type Delegation struct {
	TotalHosts int    `json:"total_ns"`
	OkCount    int    `json:"authoritative_ok"`
	LameCount  int    `json:"lame_count"`
	LameType   string `json:"lame_type"`
}
