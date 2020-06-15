import pytest

from enums.scan_types import ScanTypeEnums


def test_mail_scan_enum():
    assert ScanTypeEnums.SUPER_ADMIN == "mail"
    assert ScanTypeEnums.SUPER_ADMIN == ScanTypeEnums.get("mail")


def test_web_scan_enum():
    assert ScanTypeEnums.ADMIN == "web"
    assert ScanTypeEnums.ADMIN == ScanTypeEnums.get("web")
