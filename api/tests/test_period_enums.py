import pytest

from enums.period import PeriodEnums


def test_january_enum():
    assert PeriodEnums.JANUARY == "Jan"
    assert PeriodEnums.JANUARY == PeriodEnums.get("Jan")


def test_february_enum():
    assert PeriodEnums.FEBRUARY == "Feb"
    assert PeriodEnums.FEBRUARY == PeriodEnums.get("Feb")


def test_march_enum():
    assert PeriodEnums.MARCH == "Mar"
    assert PeriodEnums.MARCH == PeriodEnums.get("Mar")


def test_april_enum():
    assert PeriodEnums.APRIL == "Apr"
    assert PeriodEnums.APRIL == PeriodEnums.get("Apr")


def test_may_enum():
    assert PeriodEnums.MAY == "May"
    assert PeriodEnums.MAY == PeriodEnums.get("May")


def test_june_enum():
    assert PeriodEnums.JUNE == "June"
    assert PeriodEnums.JUNE == PeriodEnums.get("June")


def test_july_enum():
    assert PeriodEnums.JULY == "July"
    assert PeriodEnums.JULY == PeriodEnums.get("July")


def test_august_enum():
    assert PeriodEnums.AUGUST == "Aug"
    assert PeriodEnums.AUGUST == PeriodEnums.get("Aug")


def test_september_enum():
    assert PeriodEnums.SEPTEMBER == "Sept"
    assert PeriodEnums.SEPTEMBER == PeriodEnums.get("Sept")


def test_october_enum():
    assert PeriodEnums.OCTOBER == "Oct"
    assert PeriodEnums.OCTOBER == PeriodEnums.get("Oct")


def test_november_enum():
    assert PeriodEnums.NOVEMBER == "Nov"
    assert PeriodEnums.NOVEMBER == PeriodEnums.get("Nov")


def test_december_enum():
    assert PeriodEnums.DECEMBER == "Dec"
    assert PeriodEnums.DECEMBER == PeriodEnums.get("Dec")


def test_last_30_day_enum():
    assert PeriodEnums.LAST30DAYS == "last30days"
    assert PeriodEnums.LAST30DAYS == PeriodEnums.get("last30days")
