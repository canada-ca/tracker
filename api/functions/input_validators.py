##
# Functions for validating and sanitizing user input coming in from the web front-end.

import re
import html


##
# Password validators
##
def is_strong_password(password):
	return len(password) >= 12


##
# User input cleansing functions
##
def cleanse_input(input_string):
	input_string = input_string.strip()
	input_string = html.escape(input_string)
	return input_string
