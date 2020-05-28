import pytest

from enums.languages import LanguageEnums


def test_english_enum():
    assert LanguageEnums.ENGLISH == "english"
    assert LanguageEnums.ENGLISH == LanguageEnums.get("english")


def test_french_enum():
    assert LanguageEnums.FRENCH == "french"
    assert LanguageEnums.FRENCH == LanguageEnums.get("french")
