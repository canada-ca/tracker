from src.tracker_client import (
    format_all_domains,
    format_acronym_domains,
    format_name_domains,
    format_dmarc_monthly,
    format_dmarc_yearly,
    format_all_summaries,
    format_acronym_summary,
    format_name_summary,
)

from fixtures import (
    all_domains_input,
    all_domains_output,
    name_domain_input,
    org_domains_output,
    monthly_dmarc_input,
    monthly_dmarc_output,
    yearly_dmarc_input,
    yearly_dmarc_output,
    all_summaries_input,
    all_summaries_output,
    name_summary_input,
    org_summary_output,
)


def test_format_all_domains(all_domains_input, all_domains_output):
    assert format_all_domains(all_domains_input) == all_domains_output


def test_format_acronym_domains(all_domains_input, org_domains_output):
    assert format_acronym_domains("def", all_domains_input) == org_domains_output


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
