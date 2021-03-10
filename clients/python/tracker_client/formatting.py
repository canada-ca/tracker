"""Provides results formatting functions used in client.py"""

GUIDANCE_TAG_CATEGORIES = (
    "positiveGuidanceTags",
    "neutralGuidanceTags",
    "negativeGuidanceTags",
)


def format_dmarc_monthly(result):
    """Formats the result dict in get_dmarc_summary

    :param dict result: unformatted dict with results of DMARC_SUMMARY
    :return: formatted results
    :rtype: dict
    """
    result = result["findDomainByDomain"]
    result[result.pop("domain")] = result.pop("dmarcSummaryByPeriod")
    return result


def format_dmarc_yearly(result):
    """Formats the result dict in get_yearly_dmarc_summaries

    :param dict result: unformatted dict with results of YEARLY_DMARC_SUMMARIES
    :return: formatted results
    :rtype: dict
    """
    result = result["findDomainByDomain"]
    result[result.pop("domain")] = result.pop("yearlyDmarcSummaries")
    return result


def format_summary(result):
    """Formats the result dict in get_summary_by_name

    :param dict result: unformatted dict with results of SUMMARY_BY_SLUG
    :return: formatted results
    :rtype: dict"""
    result = {
        result["findOrganizationBySlug"].pop("acronym"): result[
            "findOrganizationBySlug"
        ]
    }
    return result


def format_all_results(result):
    """Formats the result dict in get_all_results

    :param dict result: unformatted dict with results of ALL_RESULTS
    :return: formatted results
    :rtype: dict"""
    for result_category in ("web", "email"):
        # Extract the contents of the lists of nodes holding results
        result["findDomainByDomain"][result_category] = {
            k: list(map(lambda item: item["node"], v["edges"]))
            for (k, v) in result["findDomainByDomain"][result_category].items()
        }

        # For each scan category, change guidance tags from lists of edges with nodes
        # to dicts with tagId as keys
        for scan_category in result["findDomainByDomain"][result_category]:
            # dkim is structured differently and has no results currently
            if (scan_category) != "dkim":
                for scan in result["findDomainByDomain"][result_category][
                    scan_category
                ]:
                    for tag_category in GUIDANCE_TAG_CATEGORIES:
                        scan[tag_category] = scan[tag_category]["edges"]
                        scan[tag_category] = {
                            tag["node"].pop("tagId"): tag["node"]
                            for tag in scan[tag_category]
                        }

    result = {result["findDomainByDomain"].pop("domain"): result["findDomainByDomain"]}
    return result


def format_web_results(result):
    """Formats the result dict in get_all_results

    :param dict result: unformatted dict with results of ALL_RESULTS
    :return: formatted results
    :rtype: dict"""
    # Extract the contents of the list of nodes holding web results
    result["findDomainByDomain"]["web"] = {
        k: list(map(lambda item: item["node"], v["edges"]))
        for (k, v) in result["findDomainByDomain"]["web"].items()
    }

    # For each scan category, change guidance tags from lists of edges with nodes
    # to dicts with tagId as keys
    for scan_category in result["findDomainByDomain"]["web"]:
        for scan in result["findDomainByDomain"]["web"][scan_category]:
            for tag_category in GUIDANCE_TAG_CATEGORIES:
                scan[tag_category] = scan[tag_category]["edges"]
                scan[tag_category] = {
                    tag["node"].pop("tagId"): tag["node"] for tag in scan[tag_category]
                }

    result = {result["findDomainByDomain"].pop("domain"): result["findDomainByDomain"]}
    return result


def format_email_results(result):
    """Formats the result dict in get_email_results

    :param dict result: unformatted dict with results of EMAIL_RESULTS
    :return: formatted results
    :rtype: dict"""
    # Extract the contents of the list of nodes holding email results
    result["findDomainByDomain"]["email"] = {
        k: list(map(lambda item: item["node"], v["edges"]))
        for (k, v) in result["findDomainByDomain"]["email"].items()
    }

    # For each scan category, change guidance tags from lists of edges with nodes
    # to dicts with tagId as keys
    for scan_category in result["findDomainByDomain"]["email"]:
        # dkim is structured differently and has no results currently
        if (scan_category) != "dkim":
            for scan in result["findDomainByDomain"]["email"][scan_category]:
                for tag_category in GUIDANCE_TAG_CATEGORIES:
                    scan[tag_category] = scan[tag_category]["edges"]
                    scan[tag_category] = {
                        tag["node"].pop("tagId"): tag["node"]
                        for tag in scan[tag_category]
                    }

    result = {result["findDomainByDomain"].pop("domain"): result["findDomainByDomain"]}
    return result


def format_domain_status(result):
    """Formats the result dict in get_domain_status

    :param dict result: unformatted dict with results of DOMAIN_STATUS
    :return: formatted results
    :rtype: dict"""
    result = {result["findDomainByDomain"].pop("domain"): result["findDomainByDomain"]}
    return result
