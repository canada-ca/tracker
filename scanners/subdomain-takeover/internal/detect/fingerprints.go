package detect

import "strings"

type Fingerprint struct {
	Cname       []string
	Name        string
	Nxdomain    bool
	Fingerprint string
}

func (f *Fingerprint) ContainsCname(target string) bool {
	for _, cname := range f.Cname {
		if strings.HasSuffix(target, cname) {
			return true
		}
	}
	return false
}

var Fingerprints = []Fingerprint{
	{
		Cname: []string{
			"elasticbeanstalk.com",
		},
		Nxdomain:    true,
		Name:        "AWS/Elastic Beanstalk",
		Fingerprint: "NXDOMAIN",
	},
	{
		Cname: []string{
			"s3.amazonaws.com",
		},
		Nxdomain:    false,
		Name:        "AWS/S3",
		Fingerprint: "The specified bucket does not exist",
	},
	{
		Cname: []string{
			"agilecrm.com",
		},
		Nxdomain:    false,
		Name:        "Agile CRM",
		Fingerprint: "Sorry, this page is no longer available.",
	},
	{
		Cname: []string{
			"airee.ru",
		},
		Nxdomain:    false,
		Name:        "Airee.ru",
		Fingerprint: "Ошибка 402. Сервис Айри.рф не оплачен",
	},
	{
		Cname: []string{
			"animaapp.io",
		},
		Nxdomain:    false,
		Name:        "Anima",
		Fingerprint: "The page you were looking for does not exist.",
	},
	{
		Cname: []string{
			"bitbucket.io",
		},
		Nxdomain:    false,
		Name:        "Bitbucket",
		Fingerprint: "Repository not found",
	},
	{
		Cname: []string{
			"trydiscourse.com",
		},
		Nxdomain:    true,
		Name:        "Discourse",
		Fingerprint: "NXDOMAIN",
	},
	{
		Cname: []string{
			"furyns.com",
		},
		Nxdomain:    false,
		Name:        "Gemfury",
		Fingerprint: "404: This page could not be found.",
	},
	{
		Cname: []string{
			"ghost.io",
		},
		Nxdomain:    false,
		Name:        "Ghost",
		Fingerprint: "Site unavailable\\.&#124;Failed to resolve DNS path for this host",
	},
	{
		Cname: []string{
			"hatenablog.com",
		},
		Nxdomain:    false,
		Name:        "HatenaBlog",
		Fingerprint: "404 Blog is not found",
	},
	{
		Cname: []string{
			"helpjuice.com",
		},
		Nxdomain:    false,
		Name:        "Help Juice",
		Fingerprint: "We could not find what you're looking for.",
	},
	{
		Cname: []string{
			"helpscoutdocs.com",
		},
		Nxdomain:    false,
		Name:        "Help Scout",
		Fingerprint: "No settings were found for this company:",
	},
	{
		Cname: []string{
			"helprace.com",
		},
		Nxdomain:    false,
		Name:        "Helprace",
		Fingerprint: "HTTP_STATUS=301",
	},
	{
		Cname: []string{
			"youtrack.cloud",
		},
		Nxdomain:    false,
		Name:        "JetBrains",
		Fingerprint: "is not a registered InCloud YouTrack",
	},
	{
		Cname: []string{
			"launchrock.com",
		},
		Nxdomain:    false,
		Name:        "LaunchRock",
		Fingerprint: "HTTP_STATUS=500",
	},
	{
		Cname: []string{
			"cloudapp.azure.com",
			"azurewebsites.net",
			"blob.core.windows.net",
			"cloudapp.azure.com",
			"azure-api.net",
			"azurehdinsight.net",
			"azureedge.net",
			"azurecontainer.io",
			"database.windows.net",
			"azuredatalakestore.net",
			"search.windows.net",
			"azurecr.io",
			"redis.cache.windows.net",
			"azurehdinsight.net",
			"servicebus.windows.net",
			"trafficmanager.net",
			"visualstudio.com",
		},
		Nxdomain:    true,
		Name:        "Microsoft Azure",
		Fingerprint: "NXDOMAIN",
	},
	{
		Cname: []string{
			"ngrok.io",
		},
		Nxdomain:    false,
		Name:        "Ngrok",
		Fingerprint: "Tunnel .*.ngrok.io not found",
	},
	{
		Cname: []string{
			"readme.io",
		},
		Nxdomain:    false,
		Name:        "Readme.io",
		Fingerprint: "The creators of this project are still working on making everything perfect!",
	},
	{
		Cname: []string{
			"52.16.160.97",
		},
		Nxdomain:    false,
		Name:        "SmartJobBoard",
		Fingerprint: "This job board website is either expired or its domain name is invalid.",
	},
	{
		Cname: []string{
			"s.strikinglydns.com",
		},
		Nxdomain:    false,
		Name:        "Strikingly",
		Fingerprint: "PAGE NOT FOUND.",
	},
	{
		Cname: []string{
			"na-west1.surge.sh",
		},
		Nxdomain:    false,
		Name:        "Surge.sh",
		Fingerprint: "project not found",
	},
	{
		Cname: []string{
			"surveysparrow.com",
		},
		Nxdomain:    false,
		Name:        "SurveySparrow",
		Fingerprint: "Account not found.",
	},
	{
		Cname: []string{
			"read.uberflip.com",
		},
		Nxdomain:    false,
		Name:        "Uberflip",
		Fingerprint: "The URL you've accessed does not provide a hub.",
	},
	{
		Cname: []string{
			"stats.uptimerobot.com",
		},
		Nxdomain:    false,
		Name:        "Uptimerobot",
		Fingerprint: "page not found",
	},
	{
		Cname: []string{
			"wordpress.com",
		},
		Nxdomain:    false,
		Name:        "Wordpress",
		Fingerprint: "Do you want to register .*.wordpress.com?",
	},
	{
		Cname: []string{
			"worksites.net",
			"69.164.223.206",
		},
		Nxdomain:    false,
		Name:        "Worksites",
		Fingerprint: "Hello! Sorry, but the website you&rsquo;re looking for doesn&rsquo;t exist.",
	},
}
