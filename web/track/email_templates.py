##
# This file contains functions for simplifying which email templates for notification api can be sent.
#


# This template should be used when verifying an account
def verify_account_template():
	return '9d2346e4-7e24-4b09-a412-5e0a43a7577c'


# This template should be used when an account is resetting their password after clicking 'forget password'
def reset_forgotten_password_template():
	return '8c3d96cc-3cbe-4043-b157-4f4a2bbb57b1'


# This template should be used when a locked account needs to reset their password
def reset_locked_account_password_template():
	return 'ec59e632-c43c-4cc3-a3de-7cde855946d7'
