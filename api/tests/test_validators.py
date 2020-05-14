import pytest
from functions.input_validators import *


def test_is_strong_password_returns_true_on_a_good_password():
    valid_pass = "ThisIsAVa1idPassword!"
    assert is_strong_password(valid_pass)


def test_is_strong_password_rejects_a_short_password():
    invalid_pass = "2short"
    assert not is_strong_password(invalid_pass)


def test_is_strong_password_rejects_an_empty_password():
    invalid_pass = ""
    assert not is_strong_password(invalid_pass)


def test_clense_input_strip_whitespace():
    output_string = cleanse_input("     strip-whitespaces     ")
    assert output_string == "strip-whitespaces"


def test_clense_input_escapes_html():
    output_string = cleanse_input("<!>")
    assert output_string == "&lt;!&gt;"
