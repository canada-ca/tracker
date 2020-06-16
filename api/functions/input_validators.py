##
# Functions for validating and sanitizing user input coming in from the web front-end.

import re
import html


def is_strong_password(password):
    """
    This function will validate a password to ensure it meets requirements
    :param password: The password to be validated.
    :return: Returns true or false dependant on if password is valid
    """
    return len(password) >= 12


def cleanse_input(input_string):
    """
    This function will take an input string and perform cleansing functions on it.  This will help ensure that injection
    attacks are prevented
    :param input_string: The string as given by the http request
    :return input_string:  Ths string after all cleansing functions are done on it.
    """
    if input_string is None:
        input_string = ""
    input_string = input_string.strip()
    input_string = html.escape(input_string)
    return input_string


def cleanse_input_list(input_list):
    """
    This function will take a list of input strings and perform cleansing functions on it.  This will help ensure that injection
    attacks are prevented
    :param input_list: The list of strings as given by the http request
    :return output_list:  Ths list of strings after all cleansing functions are done on it.
    """
    output_list = []
    for input_string in input_list:
        output_list.append(cleanse_input(input_string))

    return output_list
