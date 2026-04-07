import pytest
from unittest.mock import MagicMock, patch

import requests

from hackerone import (
    HackerOneAPIError,
    handle_res,
    get_all_assets,
    get_asset,
    create_asset,
    archive_assets,
    get_scope,
    add_scope,
    update_scope,
    _request,
)


def _ok_response(body: dict) -> MagicMock:
    res = MagicMock()
    res.ok = True
    res.json.return_value = body
    return res


def _err_response(errors: list) -> MagicMock:
    res = MagicMock()
    res.ok = False
    res.json.return_value = {"errors": errors}
    return res


# ---------------------------------------------------------------------------
# handle_res
# ---------------------------------------------------------------------------

class TestHandleRes:
    def test_returns_json_on_ok(self):
        assert handle_res(_ok_response({"data": []})) == {"data": []}

    def test_raises_hackerone_api_error_on_non_ok(self):
        with pytest.raises(HackerOneAPIError):
            handle_res(_err_response([{"title": "Not found"}]))

    def test_error_list_preserved_in_exception(self):
        errors = [{"title": "Unauthorized"}]
        with pytest.raises(HackerOneAPIError) as exc_info:
            handle_res(_err_response(errors))
        assert exc_info.value.args[0] == errors


# ---------------------------------------------------------------------------
# _request — network error translation
# ---------------------------------------------------------------------------

class TestRequest:
    @patch("hackerone._session")
    def test_translates_connection_error_to_api_error(self, mock_session):
        mock_session.request.side_effect = requests.exceptions.ConnectionError("timeout")
        with pytest.raises(HackerOneAPIError):
            _request("GET", "https://api.hackerone.com/v1/test")

    @patch("hackerone._session")
    def test_translates_timeout_to_api_error(self, mock_session):
        mock_session.request.side_effect = requests.exceptions.Timeout()
        with pytest.raises(HackerOneAPIError):
            _request("GET", "https://api.hackerone.com/v1/test")

    @patch("hackerone._session")
    def test_returns_response_on_success(self, mock_session):
        mock_response = MagicMock()
        mock_session.request.return_value = mock_response
        result = _request("GET", "https://api.hackerone.com/v1/test")
        assert result is mock_response


# ---------------------------------------------------------------------------
# get_all_assets
# ---------------------------------------------------------------------------

class TestGetAllAssets:
    @patch("hackerone._request")
    def test_always_includes_domain_type_filter(self, mock_req):
        mock_req.return_value = _ok_response({"data": []})
        get_all_assets()
        url = mock_req.call_args[0][1]
        assert "filter[asset_types][]=domain" in url

    @patch("hackerone._request")
    def test_includes_scope_filter_when_valid(self, mock_req):
        mock_req.return_value = _ok_response({"data": []})
        get_all_assets(scope="in_scope")
        url = mock_req.call_args[0][1]
        assert "filter[coverage]=in_scope" in url

    @patch("hackerone._request")
    def test_ignores_unknown_scope(self, mock_req):
        mock_req.return_value = _ok_response({"data": []})
        get_all_assets(scope="invalid_scope")
        url = mock_req.call_args[0][1]
        assert "filter[coverage]" not in url

    @patch("hackerone._request")
    def test_includes_archived_filter(self, mock_req):
        mock_req.return_value = _ok_response({"data": []})
        get_all_assets(archived=True)
        url = mock_req.call_args[0][1]
        assert "filter[archived]=true" in url

    @patch("hackerone._request")
    def test_omits_archived_filter_by_default(self, mock_req):
        mock_req.return_value = _ok_response({"data": []})
        get_all_assets()
        url = mock_req.call_args[0][1]
        assert "filter[archived]" not in url

    @patch("hackerone._request")
    def test_uses_get_method(self, mock_req):
        mock_req.return_value = _ok_response({"data": []})
        get_all_assets()
        assert mock_req.call_args[0][0] == "GET"


# ---------------------------------------------------------------------------
# create_asset
# ---------------------------------------------------------------------------

class TestCreateAsset:
    @patch("hackerone._request")
    def test_uses_post_method(self, mock_req):
        mock_req.return_value = _ok_response({"data": {}})
        create_asset(domain="example.com", options={})
        assert mock_req.call_args[0][0] == "POST"

    @patch("hackerone._request")
    def test_sets_identifier_and_asset_type(self, mock_req):
        mock_req.return_value = _ok_response({"data": {}})
        create_asset(domain="example.com", options={})
        payload = mock_req.call_args[1]["json"]
        attrs = payload["data"]["attributes"]
        assert attrs["identifier"] == "example.com"
        assert attrs["asset_type"] == "domain"

    @patch("hackerone._request")
    def test_spreads_options_into_attributes(self, mock_req):
        mock_req.return_value = _ok_response({"data": {}})
        create_asset(domain="example.com", options={"description": "test", "maxSeverity": "HIGH"})
        attrs = mock_req.call_args[1]["json"]["data"]["attributes"]
        assert attrs["description"] == "test"
        assert attrs["maxSeverity"] == "HIGH"

    @patch("hackerone._request")
    def test_includes_empty_asset_tags_relationship(self, mock_req):
        mock_req.return_value = _ok_response({"data": {}})
        create_asset(domain="example.com", options={})
        payload = mock_req.call_args[1]["json"]
        assert payload["data"]["relationships"]["asset_tags"]["data"] == []


# ---------------------------------------------------------------------------
# add_scope
# ---------------------------------------------------------------------------

class TestAddScope:
    @patch("hackerone._request")
    def test_eligible_for_submission_true_when_enrolled(self, mock_req):
        mock_req.return_value = _ok_response({"data": {}})
        add_scope(asset_name="example.com", enrollment_status="enrolled")
        attrs = mock_req.call_args[1]["json"]["data"]["attributes"]
        assert attrs["eligible_for_submission"] is True

    @patch("hackerone._request")
    def test_eligible_for_submission_false_when_denied(self, mock_req):
        mock_req.return_value = _ok_response({"data": {}})
        add_scope(asset_name="example.com", enrollment_status="deny")
        attrs = mock_req.call_args[1]["json"]["data"]["attributes"]
        assert attrs["eligible_for_submission"] is False

    @patch("hackerone._request")
    def test_eligible_for_bounty_always_false(self, mock_req):
        mock_req.return_value = _ok_response({"data": {}})
        add_scope(asset_name="example.com", enrollment_status="enrolled")
        attrs = mock_req.call_args[1]["json"]["data"]["attributes"]
        assert attrs["eligible_for_bounty"] is False

    @patch("hackerone._request")
    def test_sets_asset_identifier(self, mock_req):
        mock_req.return_value = _ok_response({"data": {}})
        add_scope(asset_name="example.com", enrollment_status="enrolled")
        attrs = mock_req.call_args[1]["json"]["data"]["attributes"]
        assert attrs["asset_identifier"] == "example.com"

    @patch("hackerone._request")
    def test_uses_post_method(self, mock_req):
        mock_req.return_value = _ok_response({"data": {}})
        add_scope(asset_name="example.com", enrollment_status="enrolled")
        assert mock_req.call_args[0][0] == "POST"


# ---------------------------------------------------------------------------
# update_scope
# ---------------------------------------------------------------------------

class TestUpdateScope:
    @patch("hackerone._request")
    def test_uses_put_method(self, mock_req):
        mock_req.return_value = _ok_response({"data": {}})
        update_scope(asset_name="example.com", scope_id="s-1", enrollment_status="enrolled")
        assert mock_req.call_args[0][0] == "PUT"

    @patch("hackerone._request")
    def test_scope_id_included_in_url(self, mock_req):
        mock_req.return_value = _ok_response({"data": {}})
        update_scope(asset_name="example.com", scope_id="scope-abc", enrollment_status="deny")
        url = mock_req.call_args[0][1]
        assert "scope-abc" in url

    @patch("hackerone._request")
    def test_eligible_for_submission_true_when_enrolled(self, mock_req):
        mock_req.return_value = _ok_response({"data": {}})
        update_scope(asset_name="example.com", scope_id="s-1", enrollment_status="enrolled")
        attrs = mock_req.call_args[1]["json"]["data"]["attributes"]
        assert attrs["eligible_for_submission"] is True

    @patch("hackerone._request")
    def test_eligible_for_submission_false_when_denied(self, mock_req):
        mock_req.return_value = _ok_response({"data": {}})
        update_scope(asset_name="example.com", scope_id="s-1", enrollment_status="deny")
        attrs = mock_req.call_args[1]["json"]["data"]["attributes"]
        assert attrs["eligible_for_submission"] is False

    @patch("hackerone._request")
    def test_sets_asset_identifier(self, mock_req):
        mock_req.return_value = _ok_response({"data": {}})
        update_scope(asset_name="example.com", scope_id="s-1", enrollment_status="deny")
        attrs = mock_req.call_args[1]["json"]["data"]["attributes"]
        assert attrs["asset_identifier"] == "example.com"


# ---------------------------------------------------------------------------
# get_scope
# ---------------------------------------------------------------------------

class TestGetScope:
    @patch("hackerone._request")
    def test_includes_asset_identifier_in_url(self, mock_req):
        mock_req.return_value = _ok_response({"data": []})
        get_scope("example.com")
        url = mock_req.call_args[0][1]
        assert "example.com" in url

    @patch("hackerone._request")
    def test_uses_get_method(self, mock_req):
        mock_req.return_value = _ok_response({"data": []})
        get_scope("example.com")
        assert mock_req.call_args[0][0] == "GET"


# ---------------------------------------------------------------------------
# archive_assets
# ---------------------------------------------------------------------------

class TestArchiveAssets:
    @patch("hackerone._request")
    def test_uses_post_method(self, mock_req):
        mock_req.return_value = _ok_response({"data": {}})
        archive_assets(data={"data": []})
        assert mock_req.call_args[0][0] == "POST"

    @patch("hackerone._request")
    def test_url_contains_archive_path(self, mock_req):
        mock_req.return_value = _ok_response({"data": {}})
        archive_assets(data={"data": []})
        url = mock_req.call_args[0][1]
        assert "archive" in url

    @patch("hackerone._request")
    def test_passes_data_as_json_body(self, mock_req):
        mock_req.return_value = _ok_response({"data": {}})
        payload = {"data": [{"id": "asset-1"}]}
        archive_assets(data=payload)
        assert mock_req.call_args[1]["json"] == payload
