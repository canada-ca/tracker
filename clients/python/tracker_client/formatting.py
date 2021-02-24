"""Provides results formatting functions used in client.py"""


def format_all_domains(result):
    """Formats the result dict in get_all_domains

    :param dict result: unformatted dict with results of ALL_DOMAINS_QUERY
    :return: formatted results
    :rtype: dict
    """
    # Extract the list of nodes from the resulting dict
    result = result["findMyOrganizations"]["edges"]
    # Move the dict value of "node" up a level
    result = [n["node"] for n in result]

    # For each dict element of the list, change the value of "domains"
    # to the list of domains contained in the nodes of its edges
    for x in result:
        x["domains"] = x["domains"]["edges"]
        x["domains"] = [n["node"] for n in x["domains"]]
        x["domains"] = [n["domain"] for n in x["domains"]]

    # Create a new dict in the desired format to return
    result = {x["acronym"]: x["domains"] for x in result}
    return result


def format_acronym_domains(result, acronym):
    """Formats the result dict in get_domains_by_acronym

    :param dict result: unformatted dict with results of ALL_DOMAINS_QUERY
    :param str acronym: an acronym referring to an organization
    :return: formatted results, filtered to only the org identified by acronym
    :rtype: dict
    :raises KeyError: if user does not have membership in an org with a matching acronym
    """
    result = format_all_domains(result)
    result = {acronym.upper(): result[acronym.upper()]}
    return result


def format_name_domains(result):
    """Formats the result dict in get_domains_by_name

    :param dict result: unformatted dict with results of DOMAINS_BY_SLUG
    :return: formatted results
    :rtype: dict
    """
    result = result["findOrganizationBySlug"]
    result["domains"] = result["domains"]["edges"]
    result["domains"] = [n["node"] for n in result["domains"]]
    result["domains"] = [n["domain"] for n in result["domains"]]
    result = {result["acronym"]: result["domains"]}
    return result


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


def format_all_summaries(result):
    """Formats the result dict in get_all_summaries

    :param dict result: unformatted dict with results of ALL_ORG_SUMMARIES
    :return: formatted results
    :rtype: dict
    """
    result = result["findMyOrganizations"]["edges"]
    result = {x["node"].pop("acronym"): x["node"] for x in result}
    return result


def format_acronym_summary(result, acronym):
    """Formats the result dict in get_summary_by_acronym

    :param dict result: unformatted dict with results of ALL_ORG_SUMMARIES
    :param str acronym: an acronym referring to an organization
    :return: formatted results, filtered to only the org identified by acronym
    :rtype: dict
    :raises KeyError: if user does not have membership in an org with a matching acronym
    """
    result = format_all_summaries(result)
    # dict in assignment is to keep the org identified in the return value
    result = {acronym.upper(): result[acronym.upper()]}
    return result


def format_name_summary(result):
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
    for x in result["findDomainByDomain"]["web"].keys():

        # Remove edges by making the value of positiveGuidanceTags the list of nodes
        result["findDomainByDomain"]["web"][x]["positiveGuidanceTags"] = result[
            "findDomainByDomain"
        ]["web"][x]["positiveGuidanceTags"]["edges"]

        # Replace the list of nodes with a dict with tagIds as the keys
        result["findDomainByDomain"]["web"][x]["positiveGuidanceTags"] = {
            x["node"].pop("tagId"): x["node"]
            for x in result["findDomainByDomain"]["web"][x]["positiveGuidanceTags"]
        }

        # Remove edges by making the value of neutralGuidanceTags the list of nodes
        result["findDomainByDomain"]["web"][x]["neutralGuidanceTags"] = result[
            "findDomainByDomain"
        ]["web"][x]["neutralGuidanceTags"]["edges"]

        # Replace the list of nodes with a dict with tagIds as the keys
        result["findDomainByDomain"]["web"][x]["neutralGuidanceTags"] = {
            x["node"].pop("tagId"): x["node"]
            for x in result["findDomainByDomain"]["web"][x]["neutralGuidanceTags"]
        }

        # Remove edges by making the value of negativeGuidanceTags the list of nodes
        result["findDomainByDomain"]["web"][x]["negativeGuidanceTags"] = result[
            "findDomainByDomain"
        ]["web"][x]["negativeGuidanceTags"]["edges"]

        # Replace the list of nodes with a dict with tagIds as the keys
        result["findDomainByDomain"]["web"][x]["negativeGuidanceTags"] = {
            x["node"].pop("tagId"): x["node"]
            for x in result["findDomainByDomain"]["web"][x]["negativeGuidanceTags"]
        }

    # Do the same with email guidance tags
    for x in result["findDomainByDomain"]["email"].keys():

        # dkim results have different structure so exclude them
        if x != "dkim":
            result["findDomainByDomain"]["email"][x]["positiveGuidanceTags"] = result[
                "findDomainByDomain"
            ]["email"][x]["positiveGuidanceTags"]["edges"]

            result["findDomainByDomain"]["email"][x]["positiveGuidanceTags"] = {
                x["node"].pop("tagId"): x["node"]
                for x in result["findDomainByDomain"]["email"][x][
                    "positiveGuidanceTags"
                ]
            }

            result["findDomainByDomain"]["email"][x]["neutralGuidanceTags"] = result[
                "findDomainByDomain"
            ]["email"][x]["neutralGuidanceTags"]["edges"]

            result["findDomainByDomain"]["email"][x]["neutralGuidanceTags"] = {
                x["node"].pop("tagId"): x["node"]
                for x in result["findDomainByDomain"]["email"][x]["neutralGuidanceTags"]
            }

            result["findDomainByDomain"]["email"][x]["negativeGuidanceTags"] = result[
                "findDomainByDomain"
            ]["email"][x]["negativeGuidanceTags"]["edges"]

            result["findDomainByDomain"]["email"][x]["negativeGuidanceTags"] = {
                x["node"].pop("tagId"): x["node"]
                for x in result["findDomainByDomain"]["email"][x][
                    "negativeGuidanceTags"
                ]
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
        k: v["edges"][0]["node"]
        for (k, v) in result["findDomainByDomain"]["web"].items()
    }

    for x in result["findDomainByDomain"]["web"].keys():
        # Remove edges by making the value of positiveGuidanceTags the list of nodes
        result["findDomainByDomain"]["web"][x]["positiveGuidanceTags"] = result[
            "findDomainByDomain"
        ]["web"][x]["positiveGuidanceTags"]["edges"]

        # Replace the list of nodes with a dict with tagIds as the keys
        result["findDomainByDomain"]["web"][x]["positiveGuidanceTags"] = {
            x["node"].pop("tagId"): x["node"]
            for x in result["findDomainByDomain"]["web"][x]["positiveGuidanceTags"]
        }

        # Remove edges by making the value of neutralGuidanceTags the list of nodes
        result["findDomainByDomain"]["web"][x]["neutralGuidanceTags"] = result[
            "findDomainByDomain"
        ]["web"][x]["neutralGuidanceTags"]["edges"]

        # Replace the list of nodes with a dict with tagIds as the keys
        result["findDomainByDomain"]["web"][x]["neutralGuidanceTags"] = {
            x["node"].pop("tagId"): x["node"]
            for x in result["findDomainByDomain"]["web"][x]["neutralGuidanceTags"]
        }

        # Remove edges by making the value of negativeGuidanceTags the list of nodes
        result["findDomainByDomain"]["web"][x]["negativeGuidanceTags"] = result[
            "findDomainByDomain"
        ]["web"][x]["negativeGuidanceTags"]["edges"]

        # Replace the list of nodes with a dict with tagIds as the keys
        result["findDomainByDomain"]["web"][x]["negativeGuidanceTags"] = {
            x["node"].pop("tagId"): x["node"]
            for x in result["findDomainByDomain"]["web"][x]["negativeGuidanceTags"]
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
        k: v["edges"][0]["node"]
        for (k, v) in result["findDomainByDomain"]["email"].items()
    }

    # Extract the contents of the list of edges for guidance tags
    for x in result["findDomainByDomain"]["email"].keys():

        # dkim results have different structure so exclude them
        if x != "dkim":
            # Remove edges by making the value of positiveGuidanceTags the list of nodes
            result["findDomainByDomain"]["email"][x]["positiveGuidanceTags"] = result[
                "findDomainByDomain"
            ]["email"][x]["positiveGuidanceTags"]["edges"]

            # Replace the list of nodes with a dict with tagIds as the keys
            result["findDomainByDomain"]["email"][x]["positiveGuidanceTags"] = {
                x["node"].pop("tagId"): x["node"]
                for x in result["findDomainByDomain"]["email"][x][
                    "positiveGuidanceTags"
                ]
            }

            # Remove edges by making the value of neutralGuidanceTags the list of nodes
            result["findDomainByDomain"]["email"][x]["neutralGuidanceTags"] = result[
                "findDomainByDomain"
            ]["email"][x]["neutralGuidanceTags"]["edges"]

            # Replace the list of nodes with a dict with tagIds as the keys
            result["findDomainByDomain"]["email"][x]["neutralGuidanceTags"] = {
                x["node"].pop("tagId"): x["node"]
                for x in result["findDomainByDomain"]["email"][x]["neutralGuidanceTags"]
            }

            # Remove edges by making the value of negativeGuidanceTags the list of nodes
            result["findDomainByDomain"]["email"][x]["negativeGuidanceTags"] = result[
                "findDomainByDomain"
            ]["email"][x]["negativeGuidanceTags"]["edges"]

            # Replace the list of nodes with a dict with tagIds as the keys
            result["findDomainByDomain"]["email"][x]["negativeGuidanceTags"] = {
                x["node"].pop("tagId"): x["node"]
                for x in result["findDomainByDomain"]["email"][x][
                    "negativeGuidanceTags"
                ]
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
