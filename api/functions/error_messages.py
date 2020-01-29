##
# This class handles error messages throughout the application.


def error_password_does_not_meet_requirements():
	return str("Password does not meet minimum requirements (Min. 8 chars, Uppercase, Number, Special Char)")


def error_passwords_do_not_match():
	return str("Passwords do not match")


def error_creating_account():
	return str("Error creating account, please try again")


def error_user_does_not_exist():
	return str("User does not exist, please register")


def error_invalid_credentials():
	return str("Incorrect email or password")
