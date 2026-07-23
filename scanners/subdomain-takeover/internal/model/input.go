package model

type Input struct {
	DomainKey string      `json:"domain_key"`
	Results   ScanResults `json:"results"`
}

type ScanResults struct {
	Domain           *string           `json:"domain"`
	NsDelegations    *NsDelegations    `json:"ns_delegations"`
	RegistrarContext *RegistrarContext `json:"registrar_context"`
	ResolveChain     [][]string        `json:"resolve_chain"`
	CnameRecord      *string           `json:"cname_record"`
	NsRecords        *NsRecords        `json:"ns_records"`
}

type NsRecords struct {
	Hostnames []string `json:"hostnames"`
	Warnings  []string `json:"warnings"`
	Error     string   `json:"error"`
}

type NsDelegations struct {
	Hosts      []string   `json:"ns_hosts"`
	Checks     []NsCheck  `json:"ns_checks"`
	Delegation Delegation `json:"ns_delegation"`
	Error      string     `json:"error"`
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

type RegistrarContext struct {
	BaseDomain            string   `json:"base_domain"`
	LookupSuccess         bool     `json:"lookup_success"`
	RDAPURL               string   `json:"rdap_url"`
	RegistrarName         string   `json:"registrar_name"`
	RegistrarID           string   `json:"registrar_id"`
	RDAPNameservers       []string `json:"rdap_nameservers"`
	DelegationMatchesRDAP *bool    `json:"delegation_matches_rdap"`
	Error                 string   `json:"error"`
}
