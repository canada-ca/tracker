import pytest
from ..functions.input_validators import *


# This class tests the password strength functions in 'input_validators.py'

class TestPasswordValidators:

	# These functions test the length requirement validator

	def test_valid_password_length(self):
		valid_pass = 'ThisIsAVa1idPassword!'
		assert has_min_chars(valid_pass)

	def test_invalid_password_length(self):
		invalid_pass = '2short'
		assert not has_min_chars(invalid_pass)

	def test_empty_password_length(self):
		invalid_pass = ''
		assert not has_min_chars(invalid_pass)


# This class tests the input cleansing function in 'input_validators.py'

class TestInputCleanser:

	def test_whitespace_strip(self):
		output_string = cleanse_input('     strip-whitespaces     ')
		assert output_string == 'strip-whitespaces'

	def test_html_specials(self):
		output_string = cleanse_input('<!>')
		assert output_string == '&lt;!&gt;'