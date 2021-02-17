"""Tests for query response formatting functions.

The queries named in ALL_CAPS can be found in tracker_client/queries.py
"""
from tracker_client.formatting import (
    format_all_domains,
    format_acronym_domains,
    format_name_domains,
    format_dmarc_monthly,
    format_dmarc_yearly,
    format_all_summaries,
    format_acronym_summary,
    format_name_summary,
    format_all_results,
    format_domain_status,
)


def test_format_all_domains(all_domains_input, all_domains_output):
    """Test formatting of ALL_DOMAINS_QUERY results"""
    assert format_all_domains(all_domains_input) == all_domains_output


def test_format_acronym_domains(all_domains_input, org_domains_output):
    """Test formatting + filtering by acronym of ALL_DOMAINS_QUERY results"""
    assert format_acronym_domains(all_domains_input, "def") == org_domains_output


def test_format_name_domains(name_domain_input, org_domains_output):
    """Test formatting of DOMAINS_BY_SLUG results"""
    assert format_name_domains(name_domain_input) == org_domains_output


def test_format_dmarc_monthly(monthly_dmarc_input, monthly_dmarc_output):
    """Test formatting of DMARC_SUMMARY results"""
    assert format_dmarc_monthly(monthly_dmarc_input) == monthly_dmarc_output


def test_format_dmarc_yearly(yearly_dmarc_input, yearly_dmarc_output):
    """Test formatting of YEARLY_DMARC_SUMMARIES results"""
    assert format_dmarc_yearly(yearly_dmarc_input) == yearly_dmarc_output


def test_format_all_summaries(all_summaries_input, all_summaries_output):
    """Test formatting of ALL_ORGS_SUMMARIES results"""
    assert format_all_summaries(all_summaries_input) == all_summaries_output


def test_format_acronym_summary(all_summaries_input, org_summary_output):
    """Test formatting + filtering by acronym of ALL_ORGS_SUMMARIES results"""
    assert format_acronym_summary(all_summaries_input, "def") == org_summary_output


def test_format_name_summary(name_summary_input, org_summary_output):
    """Test formatting of SUMMARY_BY_SLUG results"""
    assert format_name_summary(name_summary_input) == org_summary_output


def test_format_all_results(scan_results_input, scan_results_output):
    """Test formatting of ALL_RESULTS results"""
    assert format_all_results(scan_results_input) == scan_results_output


def test_format_domain_status(domain_status_input, domain_status_output):
    """Test formatting of DOMAIN_STATUS results"""
    assert format_domain_status(domain_status_input) == domain_status_output
