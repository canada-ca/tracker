package model

type Input struct {
	Domain       string     `json:"domain"`
	BaseDomain   string     `json:"base_domain"`
	ZoneApex     string     `json:"zone_apex"`
	RecordExists bool       `json:"record_exists"`
	Rcode        string     `json:"rcode"`
	ResolveChain [][]string `json:"resolve_chain"`
	CnameRecord  *string    `json:"cname_record"`
	NsRecords    NsRecords  `json:"ns_records"`
}

type NsRecords struct {
	Hostnames []string `json:"hostnames"`
	Warnings  []string `json:"warnings"`
}
