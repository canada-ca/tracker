package model

type Input struct {
	Domain       string     `json:"domain"`
	BaseDomain   string     `json:"base_domain"`
	ZoneApex     string     `json:"zone_apex"`
	RecordExists bool       `json:"record_exists"`
	RCode        string     `json:"rcode"`
	ResolveChain [][]string `json:"resolve_chain"`
	CnameRecord  string     `json:"cname_record"`
	NSRecords    NSRecords  `json:"ns_records"`
}

type NSRecords struct {
	Hostnames []string `json:"hostnames"`
	Warnings  []string `json:"warnings"`
}
