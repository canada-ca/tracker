from tracker_client.client import (
    format_all_domains,
    format_acronym_domains,
    format_name_domains,
    format_dmarc_monthly,
    format_dmarc_yearly,
    format_all_summaries,
    format_acronym_summary,
    format_name_summary,
    format_domain_results,
    format_domain_status,
)


def test_format_all_domains(all_domains_input, all_domains_output):
    assert format_all_domains(all_domains_input) == all_domains_output


def test_format_acronym_domains(all_domains_input, org_domains_output):
    assert format_acronym_domains(all_domains_input, "def") == org_domains_output


def test_format_name_domains(name_domain_input, org_domains_output):
    assert format_name_domains(name_domain_input) == org_domains_output


def test_format_dmarc_monthly(monthly_dmarc_input, monthly_dmarc_output):
    assert format_dmarc_monthly(monthly_dmarc_input) == monthly_dmarc_output


def test_format_dmarc_yearly(yearly_dmarc_input, yearly_dmarc_output):
    assert format_dmarc_yearly(yearly_dmarc_input) == yearly_dmarc_output


def test_format_all_summaries(all_summaries_input, all_summaries_output):
    assert format_all_summaries(all_summaries_input) == all_summaries_output


def test_format_acronym_summary(all_summaries_input, org_summary_output):
    assert format_acronym_summary(all_summaries_input, "def") == org_summary_output


def test_format_name_summary(name_summary_input, org_summary_output):
    assert format_name_summary(name_summary_input) == org_summary_output


def test_format_domain_results(scan_results_input, scan_results_output):
    assert format_domain_results(scan_results_input) == scan_results_output


def test_format_domain_status(domain_status_input, domain_status_output):
    assert format_domain_status(domain_status_input) == domain_status_output
