##
# This class handles error messages throughout the application.


def error_password_does_not_meet_requirements():
	"""Function that returns an error message when password does not meet requirements"""
	return str("Password does not meet minimum requirements (Must be 12 or more chars long)")


def error_passwords_do_not_match():
	"""Function that returns an error message when passwords do not meet"""
	return str("Passwords do not match")


def error_creating_account():
	"""Function that returns an error message when account creation fails"""
	return str("Error creating account, please try again")


def error_user_does_not_exist():
	"""Function that returns an error message when a user doesn't exist after querying the database"""
	return str("User does not exist, please register")


def error_email_in_use():
	"""Function that returns an error message when an email address is associated with a different account"""
	return str("An account already uses that email address, please try again")


def error_invalid_credentials():
	"""Functions that returns an error message when a user enters invalid credentials"""
	return str("Incorrect email or password")


def error_password_not_updated():
	"""Function that returns an error message when a database password update fails"""
	return str("Unable to update password, please try again")


def error_role_not_updated():
	"""Function that returns an error message when a database user_role update fails"""
	return str("Unable to update user's role, please try again")


def error_not_an_admin():
	"""Function that returns an error message when a user that is not an admin attempts to perform admin actions"""
	return str("You are not allowed to perform admin actions, please try again")


def error_user_not_updated():
	"""Function that returns an error message when a database user update fails"""
	return str("User not updated, please try again")


def error_otp_code_is_invalid():
	"""Function that returns an error message when an one time password (OTP) is invalid"""
	return str("OTP code is invalid, please try again")


def error_too_many_failed_login_attempts():
    """Function that returns an error message when a user has too many failed login attempts associated with their account"""
    return str("Too many failed login attempts, please reset your password")


def scalar_error_type(value_type, value):
	"""Function that returns an error message when a scalar type is invalid"""
	return str("Value is not a valid " + str(value_type) + ": " + str(value))


def scalar_error_only_types(value_types, expected_types, value):
	"""Function that returns an error message when a scalar type can not be validated due to mismatched types"""
	return str("Can only validate " + str(value_types) + " as " + str(expected_types) + " but got a: " + str(type(value)))
