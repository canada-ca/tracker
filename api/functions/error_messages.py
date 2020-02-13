##
# This class handles error messages throughout the application.


def error_password_does_not_meet_requirements():
	return str("Password does not meet minimum requirements (Must be 12 or more chars long)")


def error_passwords_do_not_match():
	return str("Passwords do not match")


def error_creating_account():
	return str("Error creating account, please try again")


def error_user_does_not_exist():
	return str("User does not exist, please register")


def error_email_in_use():
	return str("An account already uses that email address, please try again")


def error_invalid_credentials():
	return str("Incorrect email or password")


def error_password_not_updated():
	return str("Unable to update password, please try again")


def error_user_not_updated():
	return str("User not updated, please try again")


def error_otp_code_is_invalid():
	return str("OTP code is invalid, please try again")


def scalar_error_type(value_type, value):
	return str("Value is not a valid " + str(value_type) + ": " + str(value))


def scalar_error_only_types(value_types, expected_types, value):
	return str("Can only validate " + str(value_types) + " as " + str(expected_types) + " but got a: " + str(type(value)))
