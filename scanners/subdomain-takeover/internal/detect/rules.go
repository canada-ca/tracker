package detect

import (
	"fmt"

	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/model"
)

func GetCnameTakeoverEvidence(cname string, rcode string) *model.Finding {
	for _, fp := range Fingerprints {
		if fp.ContainsCname(cname) {
			fmt.Println(fp.Name)
			if fp.Nxdomain {
				fmt.Println("check for nxdomain on A record")
				if rcode == "NXDOMAIN" {
					fmt.Println("fingerprint match, CNAME takeover possible")
				}
			} else {
				fmt.Println("check for other fingerprint")
			}
		}
	}

	return nil
}

func getNsTakeoverEvidence(hostnames []string) *model.Finding {
	return nil
}
