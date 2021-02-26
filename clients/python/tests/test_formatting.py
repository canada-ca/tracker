"""Tests for query response formatting functions.

The queries named in ALL_CAPS can be found in tracker_client/queries.py
"""
from tracker_client.formatting import (
    format_dmarc_monthly,
    format_dmarc_yearly,
    format_summary,
    format_all_results,
    format_web_results,
    format_email_results,
    format_domain_status,
)


def test_format_dmarc_monthly(monthly_dmarc_input, monthly_dmarc_output):
    """Test formatting of DMARC_SUMMARY results"""
    assert format_dmarc_monthly(monthly_dmarc_input) == monthly_dmarc_output


def test_format_dmarc_yearly(yearly_dmarc_input, yearly_dmarc_output):
    """Test formatting of YEARLY_DMARC_SUMMARIES results"""
    assert format_dmarc_yearly(yearly_dmarc_input) == yearly_dmarc_output


def test_format_summary(name_summary_input, org_summary_output):
    """Test formatting of SUMMARY_BY_SLUG results"""
    assert format_summary(name_summary_input) == org_summary_output


def test_format_all_results(all_results_input, all_results_output):
    """Test formatting of ALL_RESULTS results"""
    assert format_all_results(all_results_input) == all_results_output


def test_format_web_results(web_results_input, web_results_output):
    """Test formatting of WEB_RESULTS results"""
    assert format_web_results(web_results_input) == web_results_output


def test_format_email_results(email_results_input, email_results_output):
    """Test formatting of EMAIL_RESULTS results"""
    assert format_email_results(email_results_input) == email_results_output


def test_format_domain_status(domain_status_input, domain_status_output):
    """Test formatting of DOMAIN_STATUS results"""
    assert format_domain_status(domain_status_input) == domain_status_output
