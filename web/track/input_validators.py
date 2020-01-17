##
# Functions for validating and sanitizing user input coming in from the web front-end.

import re
import html


##
# Password validators
##
def is_strong_password(password):
	return has_min_chars(password) and contains_special_char(password)\
		and contains_uppercase(password) and contains_number(password)


def has_min_chars(password):
	return len(password) >= 8


def contains_uppercase(password):
	return any(char.isupper() for char in password)


def contains_number(password):
	return any(char.isdigit() for char in password)


def contains_special_char(password):
	string_check = re.compile('[@_!#$%^&*()<>?/\|}{~:]')
	return not string_check.search(password) is None


##
# User input cleansing functions
##
def cleanse_input(input_string):
	input_string = input_string.strip()
	input_string = html.escape(input_string)
	return input_string
