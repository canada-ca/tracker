"""Provides functions that get JSON data from Tracker (https://github.com/canada-ca/tracker)"""
import os

# TODO: decide if we should just import whole modules instead
from core import create_client, execute_query, get_auth_token
from domains import get_all_domains, get_domains_by_acronym, get_domains_by_name
from dmarc import get_dmarc_summary, get_yearly_dmarc_summaries
from summary import get_all_summaries, get_summary_by_acronym, get_summary_by_name
from results import get_all_results, get_web_results, get_email_results, get_domain_status


def main():  # pragma: no cover
    """main() currently tries all implemented functions and prints results
    for diagnostic purposes and to demo available features. To be removed in future.
    """
    acronym = "cse"
    name = "Communications Security Establishment Canada"
    domain = "cse-cst.gc.ca"

    print("Tracker account: " + os.environ.get("TRACKER_UNAME"))
    client = create_client(auth_token=get_auth_token())

    print("Getting all your domains...")
    domains = get_all_domains(client)
    print(domains)

    print("Getting domains by acronym " + acronym + "...")
    domains = get_domains_by_acronym(client, acronym)
    print(domains)

    print("Getting domains by name " + name + "...")
    domains = get_domains_by_name(client, name)
    print(domains)

    print("Getting a dmarc summary for " + domain + "...")
    result = get_dmarc_summary(client, domain, "november", 2020)
    print(result)

    print("Getting yearly dmarc summary for " + domain + "...")
    result = get_yearly_dmarc_summaries(client, domain)
    print(result)

    print("Getting summaries for all your organizations...")
    summaries = get_all_summaries(client)
    print(summaries)

    print("Getting summary by acronym " + acronym + "...")
    summaries = get_summary_by_acronym(client, acronym)
    print(summaries)

    print("Getting summary by name " + name + "...")
    summaries = get_summary_by_name(client, name)
    print(summaries)

    print("Getting all scan results for " + domain + "...")
    results = get_all_results(client, domain)
    print(results)

    print("Getting web scan results for " + domain + "...")
    results = get_web_results(client, domain)
    print(results)

    print("Getting email scan results for " + domain + "...")
    results = get_email_results(client, domain)
    print(results)

    print("Getting domain status for " + domain + "...")
    results = get_domain_status(client, domain)
    print(results)


if __name__ == "__main__":  # pragma: no cover
    main()
