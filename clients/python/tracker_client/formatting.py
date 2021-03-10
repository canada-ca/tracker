"""Provides results formatting functions used in client.py"""
import time

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


# TODO: refactor this to reduce repetition
def format_all_results(result):
    """Formats the result dict in get_all_results

    :param dict result: unformatted dict with results of ALL_RESULTS
    :return: formatted results
    :rtype: dict"""
    # Extract the contents of the list of nodes holding web results
    result["findDomainByDomain"]["web"] = {
        k: v["edges"][0]["node"]
        for (k, v) in result["findDomainByDomain"]["web"].items()
    }

    # Extract the contents of the list of nodes holding email results
    result["findDomainByDomain"]["email"] = {
        k: v["edges"][0]["node"]
        for (k, v) in result["findDomainByDomain"]["email"].items()
    }

    # Extract the contents of the list of edges for guidance tags
    for scan_category in result["findDomainByDomain"]["web"].keys():

        # Remove edges by making the value of positiveGuidanceTags the list of nodes
        result["findDomainByDomain"]["web"][scan_category][
            "positiveGuidanceTags"
        ] = result["findDomainByDomain"]["web"][scan_category]["positiveGuidanceTags"][
            "edges"
        ]

        # Replace the list of nodes with a dict with tagIds as the keys
        result["findDomainByDomain"]["web"][scan_category]["positiveGuidanceTags"] = {
            scan_category["node"].pop("tagId"): scan_category["node"]
            for scan_category in result["findDomainByDomain"]["web"][scan_category][
                "positiveGuidanceTags"
            ]
        }

        # Remove edges by making the value of neutralGuidanceTags the list of nodes
        result["findDomainByDomain"]["web"][scan_category][
            "neutralGuidanceTags"
        ] = result["findDomainByDomain"]["web"][scan_category]["neutralGuidanceTags"][
            "edges"
        ]

        # Replace the list of nodes with a dict with tagIds as the keys
        result["findDomainByDomain"]["web"][scan_category]["neutralGuidanceTags"] = {
            scan_category["node"].pop("tagId"): scan_category["node"]
            for scan_category in result["findDomainByDomain"]["web"][scan_category][
                "neutralGuidanceTags"
            ]
        }

        # Remove edges by making the value of negativeGuidanceTags the list of nodes
        result["findDomainByDomain"]["web"][scan_category][
            "negativeGuidanceTags"
        ] = result["findDomainByDomain"]["web"][scan_category]["negativeGuidanceTags"][
            "edges"
        ]

        # Replace the list of nodes with a dict with tagIds as the keys
        result["findDomainByDomain"]["web"][scan_category]["negativeGuidanceTags"] = {
            scan_category["node"].pop("tagId"): scan_category["node"]
            for scan_category in result["findDomainByDomain"]["web"][scan_category][
                "negativeGuidanceTags"
            ]
        }

    # Do the same with email guidance tags
    for scan_category in result["findDomainByDomain"]["email"].keys():

        # dkim results have different structure so exclude them
        if scan_category != "dkim":
            result["findDomainByDomain"]["email"][scan_category][
                "positiveGuidanceTags"
            ] = result["findDomainByDomain"]["email"][scan_category][
                "positiveGuidanceTags"
            ][
                "edges"
            ]

            result["findDomainByDomain"]["email"][scan_category][
                "positiveGuidanceTags"
            ] = {
                scan_category["node"].pop("tagId"): scan_category["node"]
                for scan_category in result["findDomainByDomain"]["email"][
                    scan_category
                ]["positiveGuidanceTags"]
            }

            result["findDomainByDomain"]["email"][scan_category][
                "neutralGuidanceTags"
            ] = result["findDomainByDomain"]["email"][scan_category][
                "neutralGuidanceTags"
            ][
                "edges"
            ]

            result["findDomainByDomain"]["email"][scan_category][
                "neutralGuidanceTags"
            ] = {
                scan_category["node"].pop("tagId"): scan_category["node"]
                for scan_category in result["findDomainByDomain"]["email"][
                    scan_category
                ]["neutralGuidanceTags"]
            }

            result["findDomainByDomain"]["email"][scan_category][
                "negativeGuidanceTags"
            ] = result["findDomainByDomain"]["email"][scan_category][
                "negativeGuidanceTags"
            ][
                "edges"
            ]

            result["findDomainByDomain"]["email"][scan_category][
                "negativeGuidanceTags"
            ] = {
                scan_category["node"].pop("tagId"): scan_category["node"]
                for scan_category in result["findDomainByDomain"]["email"][
                    scan_category
                ]["negativeGuidanceTags"]
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
            for tag_category in ("positiveGuidanceTags", "neutralGuidanceTags", "negativeGuidanceTags"):
                scan[tag_category] = scan[tag_category]["edges"]
                scan[tag_category] = {tag["node"].pop("tagId"): tag["node"] for tag in scan[tag_category]}

    result = {result["findDomainByDomain"].pop("domain"): result["findDomainByDomain"]}
    return result


def format_email_results(result):
    """Formats the result dict in get_email_results

    :param dict result: unformatted dict with results of EMAIL_RESULTS
    :return: formatted results
    :rtype: dict"""
    # Extract the contents of the list of nodes holding email results
    result["findDomainByDomain"]["email"] = {
        k: v["edges"][0]["node"]
        for (k, v) in result["findDomainByDomain"]["email"].items()
    }

    # Extract the contents of the list of edges for guidance tags
    for scan_category in result["findDomainByDomain"]["email"].keys():

        # dkim results have different structure so exclude them
        if scan_category != "dkim":
            # Remove edges by making the value of positiveGuidanceTags the list of nodes
            result["findDomainByDomain"]["email"][scan_category][
                "positiveGuidanceTags"
            ] = result["findDomainByDomain"]["email"][scan_category][
                "positiveGuidanceTags"
            ][
                "edges"
            ]

            # Replace the list of nodes with a dict with tagIds as the keys
            result["findDomainByDomain"]["email"][scan_category][
                "positiveGuidanceTags"
            ] = {
                scan_category["node"].pop("tagId"): scan_category["node"]
                for scan_category in result["findDomainByDomain"]["email"][
                    scan_category
                ]["positiveGuidanceTags"]
            }

            # Remove edges by making the value of neutralGuidanceTags the list of nodes
            result["findDomainByDomain"]["email"][scan_category][
                "neutralGuidanceTags"
            ] = result["findDomainByDomain"]["email"][scan_category][
                "neutralGuidanceTags"
            ][
                "edges"
            ]

            # Replace the list of nodes with a dict with tagIds as the keys
            result["findDomainByDomain"]["email"][scan_category][
                "neutralGuidanceTags"
            ] = {
                scan_category["node"].pop("tagId"): scan_category["node"]
                for scan_category in result["findDomainByDomain"]["email"][
                    scan_category
                ]["neutralGuidanceTags"]
            }

            # Remove edges by making the value of negativeGuidanceTags the list of nodes
            result["findDomainByDomain"]["email"][scan_category][
                "negativeGuidanceTags"
            ] = result["findDomainByDomain"]["email"][scan_category][
                "negativeGuidanceTags"
            ][
                "edges"
            ]

            # Replace the list of nodes with a dict with tagIds as the keys
            result["findDomainByDomain"]["email"][scan_category][
                "negativeGuidanceTags"
            ] = {
                scan_category["node"].pop("tagId"): scan_category["node"]
                for scan_category in result["findDomainByDomain"]["email"][
                    scan_category
                ]["negativeGuidanceTags"]
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
