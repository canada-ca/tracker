import pytest

from enums.scan_types import ScanTypeEnums


def test_mail_scan_enum():
    assert ScanTypeEnums.MAIL == "mail"
    assert ScanTypeEnums.MAIL == ScanTypeEnums.get("mail")


def test_web_scan_enum():
    assert ScanTypeEnums.WEB == "web"
    assert ScanTypeEnums.WEB == ScanTypeEnums.get("web")
