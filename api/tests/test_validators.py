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

	# These functions test the uppercase requirement validator

	def test_all_uppercase(self):
		password = 'ALLUPPERCASE'
		assert contains_uppercase(password)

	def test_no_uppercase(self):
		password = 'nouppercase'
		assert not contains_uppercase(password)

	def test_mixed_uppercase(self):
		password = 'mIxeDuPpeRCasE'
		assert contains_uppercase(password)

	# These functions test the number requirement validator

	def test_all_numbers(self):
		password = '12345654321'
		assert contains_number(password)

	def test_no_numbers(self):
		password = 'no-numbers'
		assert not contains_number(password)

	def test_mixed_numbers(self):
		password = 'password1234'
		assert contains_number(password)

	# These functions test the special char requirement validator

	def test_all_specials(self):
		password = '$#%*&^~!@#'
		assert contains_special_char(password)

	def test_no_specials(self):
		password = 'nospecialchars'
		assert not contains_special_char(password)

	def test_mixed_specials(self):
		password = 'password*!&'
		assert contains_special_char(password)

	# These functions test the overall strong password validator

	def test_strong_password(self):
		password = '$trongPa$$w0rd!'
		assert is_strong_password(password)

	def test_weak_password(self):
		password = 'weakpassword'
		assert not is_strong_password(password)

	def test_missing_number(self):
		password = 'missingNumber!'
		assert not is_strong_password(password)

	def test_missing_uppercase(self):
		password = 'strong123!'
		assert not is_strong_password(password)

	def test_missing_special(self):
		password = 'Password1234'
		assert not is_strong_password(password)

	def test_empty_password(self):
		password = ''
		assert not is_strong_password(password)


# This class tests the input cleansing function in 'input_validators.py'

class TestInputCleanser:

	def test_whitespace_strip(self):
		output_string = cleanse_input('     strip-whitespaces     ')
		assert output_string == 'strip-whitespaces'

	def test_html_specials(self):
		output_string = cleanse_input('<!>')
		assert output_string == '&lt;!&gt;'