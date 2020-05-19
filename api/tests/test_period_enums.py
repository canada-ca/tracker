import pytest

from enums.period import PeriodEnums


def test_january_enum():
    assert PeriodEnums.JANUARY == "january"
    assert PeriodEnums.JANUARY == PeriodEnums.get("january")


def test_february_enum():
    assert PeriodEnums.FEBRUARY == "february"
    assert PeriodEnums.FEBRUARY == PeriodEnums.get("february")


def test_march_enum():
    assert PeriodEnums.MARCH == "march"
    assert PeriodEnums.MARCH == PeriodEnums.get("march")


def test_april_enum():
    assert PeriodEnums.APRIL == "april"
    assert PeriodEnums.APRIL == PeriodEnums.get("april")


def test_may_enum():
    assert PeriodEnums.MAY == "may"
    assert PeriodEnums.MAY == PeriodEnums.get("may")


def test_june_enum():
    assert PeriodEnums.JUNE == "june"
    assert PeriodEnums.JUNE == PeriodEnums.get("june")


def test_july_enum():
    assert PeriodEnums.JULY == "july"
    assert PeriodEnums.JULY == PeriodEnums.get("july")


def test_august_enum():
    assert PeriodEnums.AUGUST == "august"
    assert PeriodEnums.AUGUST == PeriodEnums.get("august")


def test_september_enum():
    assert PeriodEnums.SEPTEMBER == "september"
    assert PeriodEnums.SEPTEMBER == PeriodEnums.get("september")


def test_october_enum():
    assert PeriodEnums.OCTOBER == "october"
    assert PeriodEnums.OCTOBER == PeriodEnums.get("october")


def test_november_enum():
    assert PeriodEnums.NOVEMBER == "november"
    assert PeriodEnums.NOVEMBER == PeriodEnums.get("november")


def test_december_enum():
    assert PeriodEnums.DECEMBER == "december"
    assert PeriodEnums.DECEMBER == PeriodEnums.get("december")


def test_last_30_day_enum():
    assert PeriodEnums.LAST30DAYS == "last30days"
    assert PeriodEnums.LAST30DAYS == PeriodEnums.get("last30days")
