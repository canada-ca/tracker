import pytest
from unittest.mock import MagicMock, patch

from hackerone import HackerOneAPIError
from main import (
    get_asset_identifiers,
    get_domain_names,
    fetch_domains,
    fetch_h1_assets,
    create_assets,
    rescope_assets,
    archive_unenrolled_assets,
    main,
)
from tests.conftest import make_h1_asset, make_domain, make_mock_db


# ---------------------------------------------------------------------------
# get_asset_identifiers
# ---------------------------------------------------------------------------

class TestGetAssetIdentifiers:
    def test_extracts_identifiers(self):
        assets = [make_h1_asset("a.com"), make_h1_asset("b.com")]
        assert get_asset_identifiers(assets) == ["a.com", "b.com"]

    def test_missing_attributes_returns_none(self):
        assert get_asset_identifiers([{}]) == [None]

    def test_empty_list(self):
        assert get_asset_identifiers([]) == []


# ---------------------------------------------------------------------------
# get_domain_names
# ---------------------------------------------------------------------------

class TestGetDomainNames:
    def test_extracts_domain_names(self):
        domains = [{"domain": "a.com"}, {"domain": "b.com"}]
        assert get_domain_names(domains) == ["a.com", "b.com"]

    def test_missing_domain_returns_none(self):
        assert get_domain_names([{}]) == [None]

    def test_empty_list(self):
        assert get_domain_names([]) == []


# ---------------------------------------------------------------------------
# fetch_domains
# ---------------------------------------------------------------------------

class TestFetchDomains:
    def test_returns_all_domains(self):
        domains = [make_domain("a.com", "enrolled"), make_domain("b.com")]
        all_d, _, _ = fetch_domains(make_mock_db(domains))
        assert len(all_d) == 2

    def test_splits_enrolled_and_denied(self):
        domains = [
            make_domain("enrolled.com", "enrolled"),
            make_domain("denied.com", "deny"),
            make_domain("pending.com", "pending"),
            make_domain("plain.com"),
        ]
        _, enrolled, denied = fetch_domains(make_mock_db(domains))
        assert [d["domain"] for d in enrolled] == ["enrolled.com"]
        assert [d["domain"] for d in denied] == ["denied.com"]

    def test_non_dict_cvd_enrollment_excluded(self):
        domains = [{"domain": "x.com", "cvdEnrollment": "enrolled"}]
        _, enrolled, denied = fetch_domains(make_mock_db(domains))
        assert enrolled == []
        assert denied == []

    def test_raises_on_db_error(self):
        db = MagicMock()
        db.aql.execute.side_effect = Exception("DB connection failed")
        with pytest.raises(Exception, match="DB connection failed"):
            fetch_domains(db)


# ---------------------------------------------------------------------------
# fetch_h1_assets
# ---------------------------------------------------------------------------

class TestFetchH1Assets:
    @patch("main.get_all_assets")
    def test_returns_both_asset_lists(self, mock_get):
        mock_get.side_effect = [
            {"data": [make_h1_asset("a.com")]},
            {"data": [make_h1_asset("b.com")]},
        ]
        in_scope, out_of_scope = fetch_h1_assets()
        assert len(in_scope) == 1
        assert len(out_of_scope) == 1

    @patch("main.get_all_assets")
    def test_raises_when_in_scope_fails(self, mock_get):
        mock_get.side_effect = HackerOneAPIError("API error")
        with pytest.raises(HackerOneAPIError):
            fetch_h1_assets()

    @patch("main.get_all_assets")
    def test_returns_empty_list_when_out_of_scope_fails(self, mock_get):
        mock_get.side_effect = [
            {"data": [make_h1_asset("a.com")]},
            HackerOneAPIError("API error"),
        ]
        in_scope, out_of_scope = fetch_h1_assets()
        assert len(in_scope) == 1
        assert out_of_scope == []

    @patch("main.get_all_assets")
    def test_calls_in_scope_then_out_of_scope(self, mock_get):
        mock_get.side_effect = [{"data": []}, {"data": []}]
        fetch_h1_assets()
        assert mock_get.call_args_list[0][1]["scope"] == "in_scope"
        assert mock_get.call_args_list[1][1]["scope"] == "out_of_scope"


# ---------------------------------------------------------------------------
# create_assets
# ---------------------------------------------------------------------------

class TestCreateAssets:
    @patch("main.add_scope")
    @patch("main.create_asset")
    def test_creates_asset_and_scope_for_each_domain(self, mock_create, mock_add):
        mock_create.return_value = {"data": {}}
        mock_add.return_value = {"data": {}}
        ok, fail = create_assets([make_domain("a.com", "enrolled"), make_domain("b.com", "enrolled")])
        assert ok == 2
        assert fail == 0
        assert mock_create.call_count == 2
        assert mock_add.call_count == 2

    @patch("main.add_scope")
    @patch("main.create_asset")
    def test_counts_failure_and_continues(self, mock_create, mock_add):
        mock_create.side_effect = [HackerOneAPIError("fail"), {"data": {}}]
        mock_add.return_value = {"data": {}}
        ok, fail = create_assets([make_domain("fail.com", "enrolled"), make_domain("ok.com", "enrolled")])
        assert ok == 1
        assert fail == 1

    @patch("main.add_scope")
    @patch("main.create_asset")
    def test_failure_on_add_scope_counted_as_failure(self, mock_create, mock_add):
        mock_create.return_value = {"data": {}}
        mock_add.side_effect = HackerOneAPIError("scope fail")
        ok, fail = create_assets([make_domain("a.com", "enrolled")])
        assert ok == 0
        assert fail == 1

    @patch("main.add_scope")
    @patch("main.create_asset")
    def test_empty_list_returns_zero_counts(self, mock_create, mock_add):
        ok, fail = create_assets([])
        assert ok == 0
        assert fail == 0
        mock_create.assert_not_called()

    @patch("main.add_scope")
    @patch("main.create_asset")
    def test_passes_enrollment_status_to_add_scope(self, mock_create, mock_add):
        mock_create.return_value = {"data": {}}
        mock_add.return_value = {"data": {}}
        create_assets([make_domain("a.com", "deny")])
        mock_add.assert_called_once_with(asset_name="a.com", enrollment_status="deny")

    @patch("main.add_scope")
    @patch("main.create_asset")
    def test_passes_full_cvd_options_to_create_asset(self, mock_create, mock_add):
        mock_create.return_value = {"data": {}}
        mock_add.return_value = {"data": {}}
        options = {"status": "enrolled", "description": "test desc", "maxSeverity": "HIGH"}
        domain = {"domain": "a.com", "cvdEnrollment": options}
        create_assets([domain])
        mock_create.assert_called_once_with(domain="a.com", options=options)


# ---------------------------------------------------------------------------
# rescope_assets
# ---------------------------------------------------------------------------

class TestRescopeAssets:
    @patch("main.update_scope")
    @patch("main.get_scope")
    def test_rescopes_each_domain(self, mock_get, mock_update):
        mock_get.return_value = {"data": [{"id": "scope-1"}]}
        mock_update.return_value = {"data": {}}
        ok, fail = rescope_assets(["a.com", "b.com"], "enrolled")
        assert ok == 2
        assert fail == 0
        assert mock_update.call_count == 2

    @patch("main.update_scope")
    @patch("main.get_scope")
    def test_failure_when_no_scope_data_returned(self, mock_get, mock_update):
        mock_get.return_value = {"data": []}
        ok, fail = rescope_assets(["a.com"], "enrolled")
        assert ok == 0
        assert fail == 1
        mock_update.assert_not_called()

    @patch("main.update_scope")
    @patch("main.get_scope")
    def test_continues_on_api_error(self, mock_get, mock_update):
        mock_get.side_effect = [
            HackerOneAPIError("fail"),
            {"data": [{"id": "scope-2"}]},
        ]
        mock_update.return_value = {"data": {}}
        ok, fail = rescope_assets(["fail.com", "ok.com"], "deny")
        assert ok == 1
        assert fail == 1

    @patch("main.update_scope")
    @patch("main.get_scope")
    def test_passes_correct_scope_id_and_status(self, mock_get, mock_update):
        mock_get.return_value = {"data": [{"id": "scope-789"}]}
        mock_update.return_value = {"data": {}}
        rescope_assets(["a.com"], "deny")
        mock_update.assert_called_once_with(
            asset_name="a.com", scope_id="scope-789", enrollment_status="deny"
        )

    @patch("main.update_scope")
    @patch("main.get_scope")
    def test_empty_list_returns_zero_counts(self, mock_get, mock_update):
        ok, fail = rescope_assets([], "enrolled")
        assert ok == 0
        assert fail == 0
        mock_get.assert_not_called()


# ---------------------------------------------------------------------------
# archive_unenrolled_assets
# ---------------------------------------------------------------------------

class TestArchiveUnenrolledAssets:
    @patch("main.archive_assets")
    def test_calls_archive_with_wrapped_data(self, mock_archive):
        mock_archive.return_value = {"data": {}}
        assets = [make_h1_asset("old.com")]
        archive_unenrolled_assets(assets)
        mock_archive.assert_called_once_with(data={"data": assets})

    @patch("main.archive_assets")
    def test_propagates_api_error(self, mock_archive):
        mock_archive.side_effect = HackerOneAPIError("archive failed")
        with pytest.raises(HackerOneAPIError):
            archive_unenrolled_assets([make_h1_asset("old.com")])


# ---------------------------------------------------------------------------
# main — orchestration logic
# ---------------------------------------------------------------------------

class TestMain:
    """Tests for main() focus on which operations are triggered for each sync scenario."""

    def _run(self, domains, in_scope=None, out_of_scope=None):
        """Helper: run main() with mocked H1 assets and return the four operation mocks."""
        in_scope = in_scope or []
        out_of_scope = out_of_scope or []

        with (
            patch("main.fetch_h1_assets", return_value=(in_scope, out_of_scope)),
            patch("main.create_assets", return_value=(len(domains), 0)) as mock_create,
            patch("main.rescope_assets", return_value=(1, 0)) as mock_rescope,
            patch("main.archive_unenrolled_assets") as mock_archive,
        ):
            main(make_mock_db(domains))
            return mock_create, mock_rescope, mock_archive

    def test_creates_new_enrolled_asset_not_in_h1(self):
        domain = make_domain("new.com", "enrolled")
        mock_create, _, _ = self._run([domain])
        mock_create.assert_called_once_with([domain])

    def test_does_not_create_asset_already_in_scope_in_h1(self):
        mock_create, _, _ = self._run(
            [make_domain("existing.com", "enrolled")],
            in_scope=[make_h1_asset("existing.com")],
        )
        mock_create.assert_not_called()

    def test_rescopes_out_of_scope_to_enrolled(self):
        """deny → enrolled: domain exists in H1 as out-of-scope."""
        _, mock_rescope, _ = self._run(
            [make_domain("rescoped.com", "enrolled")],
            out_of_scope=[make_h1_asset("rescoped.com")],
        )
        mock_rescope.assert_any_call(["rescoped.com"], "enrolled")

    def test_does_not_create_asset_when_rescoping_to_enrolled(self):
        """Domain in H1 out-of-scope + enrolled in tracker → rescope only, no create."""
        mock_create, _, _ = self._run(
            [make_domain("rescoped.com", "enrolled")],
            out_of_scope=[make_h1_asset("rescoped.com")],
        )
        mock_create.assert_not_called()

    def test_creates_new_denied_asset_not_in_h1(self):
        domain = make_domain("denied.com", "deny")
        mock_create, _, _ = self._run([domain])
        mock_create.assert_called_once_with([domain])

    def test_does_not_create_denied_asset_already_out_of_scope_in_h1(self):
        mock_create, _, _ = self._run(
            [make_domain("existing-denied.com", "deny")],
            out_of_scope=[make_h1_asset("existing-denied.com")],
        )
        mock_create.assert_not_called()

    def test_rescopes_in_scope_to_denied(self):
        """enrolled → deny: domain is in-scope in H1 but denied in tracker."""
        _, mock_rescope, _ = self._run(
            [make_domain("toscope.com", "deny")],
            in_scope=[make_h1_asset("toscope.com")],
        )
        mock_rescope.assert_any_call(["toscope.com"], "deny")

    def test_archives_asset_with_no_cvd_enrollment(self):
        """Domain in H1 in-scope but no CVD enrollment in tracker → archive."""
        asset = make_h1_asset("old.com")
        _, _, mock_archive = self._run(
            [make_domain("old.com")],
            in_scope=[asset],
        )
        mock_archive.assert_called_once_with([asset])

    def test_does_not_archive_denied_assets(self):
        """Denied domains should be rescoped, not archived."""
        _, _, mock_archive = self._run(
            [make_domain("denied.com", "deny")],
            in_scope=[make_h1_asset("denied.com")],
        )
        mock_archive.assert_not_called()

    def test_does_not_archive_unknown_domain(self):
        """H1 asset with no matching domain in tracker DB → not archived."""
        asset = make_h1_asset("unknown.com")
        _, _, mock_archive = self._run([], in_scope=[asset])
        mock_archive.assert_not_called()

    def test_returns_early_on_db_error(self):
        db = MagicMock()
        db.aql.execute.side_effect = Exception("DB down")
        with patch("main.fetch_h1_assets") as mock_fetch:
            main(db)
            mock_fetch.assert_not_called()

    def test_returns_early_on_h1_in_scope_error(self):
        with (
            patch("main.fetch_h1_assets", side_effect=HackerOneAPIError("H1 down")),
            patch("main.create_assets") as mock_create,
        ):
            main(make_mock_db([make_domain("a.com", "enrolled")]))
            mock_create.assert_not_called()

    def test_proceeds_with_empty_out_of_scope_on_degraded_run(self):
        """Degraded run (out-of-scope unavailable) still creates new enrolled assets."""
        domain = make_domain("new.com", "enrolled")
        with (
            patch("main.fetch_h1_assets", return_value=([], [])),
            patch("main.create_assets", return_value=(1, 0)) as mock_create,
            patch("main.rescope_assets", return_value=(0, 0)),
            patch("main.archive_unenrolled_assets"),
        ):
            main(make_mock_db([domain]))
            mock_create.assert_called_once_with([domain])
