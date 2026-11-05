"""Tests for the hackerone API client, run against the in-process FakeH1Server."""

import base64
import socket

import pytest

from hackerone import (
    HackerOneAPIError,
    HackerOneSettings,
    add_scope,
    archive_assets,
    create_asset,
    get_all_assets,
    get_asset,
    get_asset_tags,
    get_scope,
    update_scope,
    _request,
)

OK_LIST = {"data": []}
OK_OBJECT = {"data": {}}


def only_request(server):
    """Return the single request the fake received, failing if it saw any other count."""
    assert len(server.received) == 1
    return server.received[0]


def closed_port_settings() -> HackerOneSettings:
    """Return settings whose base URL points at a localhost port nothing listens on."""
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        port = s.getsockname()[1]
    return HackerOneSettings(
        org_id="org", program_id="prog", username="user", token="token", base_url=f"http://127.0.0.1:{port}/v1"
    )


# ---------------------------------------------------------------------------
# Error handling: HTTP status codes, malformed bodies, connection failures
# ---------------------------------------------------------------------------

ERROR_STATUSES = [
    pytest.param(400, id="bad_request"),
    pytest.param(401, id="unauthorized"),
    pytest.param(403, id="forbidden"),
    pytest.param(404, id="not_found"),
    pytest.param(422, id="unprocessable"),
    pytest.param(500, id="server_error"),
    pytest.param(503, id="service_unavailable"),
]

CLIENT_CALLS = [
    pytest.param("GET", "/assets", lambda s: get_all_assets(s), id="get_all_assets"),
    pytest.param("GET", "/assets", lambda s: get_asset(s, "a.ca"), id="get_asset"),
    pytest.param("POST", "/assets", lambda s: create_asset(s, "a.ca", {}, 1), id="create_asset"),
    pytest.param("POST", "/archive", lambda s: archive_assets(s, {"data": []}), id="archive_assets"),
    pytest.param("GET", "/scopes", lambda s: get_scope(s, "x"), id="get_scope"),
    pytest.param("POST", "/scopes", lambda s: add_scope(s, "x", "enrolled"), id="add_scope"),
    pytest.param("PUT", "/scopes/s1", lambda s: update_scope(s, "x", "s1", "deny"), id="update_scope"),
    pytest.param("GET", "/asset_tags", lambda s: get_asset_tags(s), id="get_asset_tags"),
]


@pytest.mark.parametrize("status", ERROR_STATUSES)
@pytest.mark.parametrize("method, target, call", CLIENT_CALLS)
def test_error_status_raises_api_error_with_error_list(h1_server, method, target, call, status):
    errors = [{"title": f"failure {status}"}]
    h1_server.respond(method, target, status, {"errors": errors})
    with pytest.raises(HackerOneAPIError) as exc_info:
        call(h1_server.settings)
    assert exc_info.value.args[0] == errors


def test_error_response_without_errors_key_raises_empty_error_list(h1_server):
    h1_server.respond("GET", "/assets", 500, {"message": "boom"})
    with pytest.raises(HackerOneAPIError) as exc_info:
        get_all_assets(h1_server.settings)
    assert exc_info.value.args[0] == []


@pytest.mark.parametrize(
    "status, raw",
    [
        pytest.param(200, b"{not json", id="ok_status_malformed_json"),
        pytest.param(200, b"", id="ok_status_empty_body"),
        pytest.param(500, b"<html>Bad Gateway</html>", id="error_status_html_body"),
    ],
)
def test_non_json_body_raises_decode_error(h1_server, status, raw):
    # handle_res calls res.json() unguarded, so a ValueError (requests'
    # JSONDecodeError) escapes instead of HackerOneAPIError.
    h1_server.respond_raw("GET", "/assets", status, raw)
    with pytest.raises(ValueError):
        get_all_assets(h1_server.settings)


def test_request_translates_connection_failure_to_api_error():
    settings = closed_port_settings()
    with pytest.raises(HackerOneAPIError):
        _request(settings, "GET", f"{settings.base_url}/test")


def test_api_function_translates_connection_failure_to_api_error():
    with pytest.raises(HackerOneAPIError):
        get_all_assets(closed_port_settings())


def test_request_returns_raw_response_on_success(h1_server):
    h1_server.respond("GET", "/v1/test", 200, {"hello": "world"})
    res = _request(h1_server.settings, "GET", f"{h1_server.url}/v1/test")
    assert res.ok
    assert res.json() == {"hello": "world"}


def test_request_returns_error_response_without_raising_on_http_error(h1_server):
    h1_server.respond("GET", "/v1/test", 404, {"errors": []})
    res = _request(h1_server.settings, "GET", f"{h1_server.url}/v1/test")
    assert res.status_code == 404


def test_handle_res_returns_decoded_json_on_ok(h1_server):
    h1_server.respond("GET", "/assets", 200, {"data": [{"id": "1"}]})
    assert get_all_assets(h1_server.settings) == {"data": [{"id": "1"}]}


# ---------------------------------------------------------------------------
# Request headers and authentication
# ---------------------------------------------------------------------------

def test_requests_send_basic_auth_from_settings_credentials(h1_server):
    h1_server.respond("GET", "/assets", 200, OK_LIST)
    get_all_assets(h1_server.settings)
    expected = "Basic " + base64.b64encode(b"user:token").decode()
    assert only_request(h1_server).authorization == expected


def test_requests_send_json_accept_header(h1_server):
    h1_server.respond("GET", "/assets", 200, OK_LIST)
    get_all_assets(h1_server.settings)
    assert only_request(h1_server).headers["Accept"] == "application/json"


def test_requests_with_body_send_json_content_type(h1_server):
    h1_server.respond("POST", "/archive", 200, OK_OBJECT)
    archive_assets(h1_server.settings, {"data": []})
    assert only_request(h1_server).headers["Content-Type"] == "application/json"


# ---------------------------------------------------------------------------
# get_all_assets
# ---------------------------------------------------------------------------

@pytest.mark.parametrize(
    "kwargs, expected_query",
    [
        pytest.param({}, {"filter[asset_types][]": ["domain"], "filter[coverage]": ["all"]}, id="defaults"),
        pytest.param(
            {"scope": "in_scope"},
            {"filter[asset_types][]": ["domain"], "filter[coverage]": ["in_scope"]},
            id="valid_scope",
        ),
        pytest.param(
            {"scope": "untested", "archived": True},
            {
                "filter[asset_types][]": ["domain"],
                "filter[archived]": ["true"],
                "filter[coverage]": ["untested"],
            },
            id="scope_and_archived",
        ),
        pytest.param(
            {"scope": "invalid_scope"},
            {"filter[asset_types][]": ["domain"]},
            id="unknown_scope_ignored",
        ),
        pytest.param(
            {"scope": ""},
            {"filter[asset_types][]": ["domain"]},
            id="empty_scope_ignored",
        ),
        pytest.param(
            {"archived": True},
            {
                "filter[asset_types][]": ["domain"],
                "filter[archived]": ["true"],
                "filter[coverage]": ["all"],
            },
            id="archived_only",
        ),
    ],
)
def test_get_all_assets_sends_expected_filters(h1_server, kwargs, expected_query):
    h1_server.respond("GET", "/assets", 200, OK_LIST)
    get_all_assets(h1_server.settings, **kwargs)
    req = only_request(h1_server)
    assert req.method == "GET"
    assert req.path == "/v1/organizations/org/assets"
    assert req.query == expected_query
    assert req.body is None


def test_get_all_assets_omits_archived_filter_by_default(h1_server):
    h1_server.respond("GET", "/assets", 200, OK_LIST)
    get_all_assets(h1_server.settings)
    assert "filter[archived]" not in only_request(h1_server).query


def test_get_all_assets_returns_response_body(h1_server):
    body = {"data": [{"id": "a1"}, {"id": "a2"}]}
    h1_server.respond("GET", "/assets", 200, body)
    assert get_all_assets(h1_server.settings) == body


# ---------------------------------------------------------------------------
# get_asset
# ---------------------------------------------------------------------------

def test_get_asset_filters_by_identifier_and_domain_type(h1_server):
    h1_server.respond("GET", "/assets", 200, {"data": [{"id": "a1"}]})
    result = get_asset(h1_server.settings, "example.ca")
    req = only_request(h1_server)
    assert req.method == "GET"
    assert req.query == {"filter[identifier]": ["example.ca"], "filter[asset_types][]": ["domain"]}
    assert result == {"data": [{"id": "a1"}]}


# ---------------------------------------------------------------------------
# create_asset
# ---------------------------------------------------------------------------

def _create_asset_body(h1_server, options, asset_tag_id=7) -> dict:
    """Call create_asset against the fake and return the JSON body it received."""
    h1_server.respond("POST", "/assets", 201, OK_OBJECT)
    create_asset(h1_server.settings, domain="example.com", options=options, asset_tag_id=asset_tag_id)
    req = only_request(h1_server)
    assert req.method == "POST"
    assert req.path == "/v1/organizations/org/assets"
    return req.body


def test_create_asset_sends_full_payload_for_empty_options(h1_server):
    assert _create_asset_body(h1_server, {}) == {
        "data": {
            "type": "asset",
            "attributes": {
                "asset_type": "domain",
                "identifier": "example.com",
                "max_severity": "high",
                "description": None,
                "reference": None,
            },
            "relationships": {"asset_tags": {"data": [{"id": 7}]}},
        }
    }


@pytest.mark.parametrize(
    "options, expected_description, expected_reference",
    [
        pytest.param(
            {"description": "test", "reference": "ref-1"},
            "test",
            "ref-1",
            id="description_and_reference_copied_into_attributes",
        ),
        pytest.param(
            {"description": None, "reference": "ref-1"},
            None,
            "ref-1",
            id="none_description_sent_as_null",
        ),
        pytest.param(
            {"description": None},
            None,
            None,
            id="all_none_sent_as_null",
        ),
        pytest.param(
            {"description": ""},
            "",
            None,
            id="empty_string_is_kept",
        ),
    ],
)
def test_create_asset_option_handling(
    h1_server, options, expected_description, expected_reference
):
    attrs = _create_asset_body(h1_server, options)["data"]["attributes"]
    assert attrs["description"] == expected_description
    assert attrs["reference"] == expected_reference


def test_create_asset_ignores_options_that_cannot_override_max_severity(h1_server):
    attrs = _create_asset_body(h1_server, {"max_severity": "low"})["data"]["attributes"]
    assert attrs["max_severity"] == "high"


def test_create_asset_uses_given_asset_tag_id(h1_server):
    body = _create_asset_body(h1_server, {}, asset_tag_id=42)
    assert body["data"]["relationships"]["asset_tags"]["data"] == [{"id": 42}]


def test_create_asset_returns_response_body(h1_server):
    h1_server.respond("POST", "/assets", 201, {"data": {"id": "new"}})
    assert create_asset(h1_server.settings, "example.com", {}, 7) == {"data": {"id": "new"}}


def test_create_asset_is_not_retried_on_server_error(h1_server):
    h1_server.respond("POST", "/assets", 500, {"errors": [{"title": "x"}]})
    with pytest.raises(HackerOneAPIError):
        create_asset(h1_server.settings, "example.com", {}, 7)
    assert len(h1_server.calls("POST", "/assets")) == 1


# ---------------------------------------------------------------------------
# add_scope / update_scope
# ---------------------------------------------------------------------------

ENROLLMENT_ELIGIBILITY = [
    pytest.param("enrolled", True, id="enrolled_is_eligible"),
    pytest.param("deny", False, id="deny_is_not_eligible"),
    pytest.param("pending", False, id="other_status_is_not_eligible"),
    pytest.param("", False, id="empty_status_is_not_eligible"),
]


@pytest.mark.parametrize("status, eligible", ENROLLMENT_ELIGIBILITY)
def test_add_scope_attributes_follow_enrollment_status(h1_server, status, eligible):
    h1_server.respond("POST", "/scopes", 201, OK_OBJECT)
    add_scope(h1_server.settings, asset_id="asset-123", enrollment_status=status)
    req = only_request(h1_server)
    assert req.method == "POST"
    assert req.path == "/v1/organizations/org/assets/asset-123/scopes"
    assert req.body["data"]["type"] == "structured-scope"
    assert req.body["data"]["attributes"] == {
        "eligible_for_bounty": False,
        "eligible_for_submission": eligible,
    }


def test_add_scope_links_configured_program(h1_server):
    h1_server.respond("POST", "/scopes", 201, OK_OBJECT)
    add_scope(h1_server.settings, asset_id="asset-123", enrollment_status="enrolled")
    programs = only_request(h1_server).body["data"]["relationships"]["programs"]["data"]
    assert programs == [{"id": "prog", "type": "program"}]


def test_add_scope_returns_response_body(h1_server):
    h1_server.respond("POST", "/scopes", 201, {"data": {"id": "s9"}})
    assert add_scope(h1_server.settings, "asset-123", "enrolled") == {"data": {"id": "s9"}}


@pytest.mark.parametrize("status, eligible", ENROLLMENT_ELIGIBILITY)
def test_update_scope_attributes_follow_enrollment_status(h1_server, status, eligible):
    h1_server.respond("PUT", "/scopes/scope-abc", 200, OK_OBJECT)
    update_scope(h1_server.settings, asset_id="asset-123", scope_id="scope-abc", enrollment_status=status)
    req = only_request(h1_server)
    assert req.method == "PUT"
    assert req.path == "/v1/organizations/org/assets/asset-123/scopes/scope-abc"
    assert req.body == {
        "data": {
            "type": "structured-scope",
            "attributes": {
                "eligible_for_bounty": False,
                "eligible_for_submission": eligible,
            },
        }
    }


def test_update_scope_returns_response_body(h1_server):
    h1_server.respond("PUT", "/scopes/s1", 200, {"data": {"id": "s1"}})
    assert update_scope(h1_server.settings, "asset-123", "s1", "deny") == {"data": {"id": "s1"}}


# ---------------------------------------------------------------------------
# get_scope
# ---------------------------------------------------------------------------

def test_get_scope_requests_asset_scopes_and_returns_body(h1_server):
    body = {"data": [{"id": "s1"}]}
    h1_server.respond("GET", "/scopes", 200, body)
    assert get_scope(h1_server.settings, "asset-123") == body
    req = only_request(h1_server)
    assert req.method == "GET"
    assert req.path == "/v1/organizations/org/assets/asset-123/scopes"
    assert req.body is None


# ---------------------------------------------------------------------------
# archive_assets
# ---------------------------------------------------------------------------

@pytest.mark.parametrize(
    "payload",
    [
        pytest.param({"data": [{"id": "asset-1"}]}, id="single_asset"),
        pytest.param({"data": [{"id": "asset-1"}, {"id": "asset-2"}]}, id="multiple_assets"),
        pytest.param({"data": []}, id="empty_list"),
    ],
)
def test_archive_assets_posts_payload_unchanged(h1_server, payload):
    h1_server.respond("POST", "/archive", 200, OK_OBJECT)
    archive_assets(h1_server.settings, data=payload)
    req = only_request(h1_server)
    assert req.method == "POST"
    assert req.path == "/v1/organizations/org/assets/archive"
    assert req.body == payload


# ---------------------------------------------------------------------------
# get_asset_tags
# ---------------------------------------------------------------------------

@pytest.mark.parametrize(
    "kwargs, page_number, page_size",
    [
        pytest.param({}, "1", "100", id="defaults"),
        pytest.param({"page_number": 3, "page_size": 50}, "3", "50", id="explicit_pagination"),
        pytest.param({"page_number": 1, "page_size": 1}, "1", "1", id="minimum_page"),
    ],
)
def test_get_asset_tags_sends_pagination_params(h1_server, kwargs, page_number, page_size):
    h1_server.respond("GET", "/asset_tags", 200, OK_LIST)
    get_asset_tags(h1_server.settings, **kwargs)
    req = only_request(h1_server)
    assert req.method == "GET"
    assert req.path == "/v1/organizations/org/asset_tags"
    assert req.query == {"page[size]": [page_size], "page[number]": [page_number]}


def test_get_asset_tags_returns_response_body(h1_server):
    body = {"data": [{"id": 1, "attributes": {"name": "cvd"}}]}
    h1_server.respond("GET", "/asset_tags", 200, body)
    assert get_asset_tags(h1_server.settings) == body
