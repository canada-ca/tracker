# Register Page Error Messages
def password_weak_register(user_name, user_email):
    return {'error': 'Password does not meet minimum requirements (Min. 8 chars, Uppercase, Number, Special Char)',
            'name': user_name,
            'email': user_email
            }


def password_not_match_register(user_name, user_email):
    return {'error': 'Passwords do not match',
            'name': user_name,
            'email': user_email
            }


def email_already_taken(user_name, user_email):
    return {'error': 'Sorry that email has already been taken, please try another email, or try logging in',
            'name': user_name,
            'email': user_email
            }


# Sign In Page Error Messages
def sign_in_incorrect(user_email):
    return {'error': 'Incorrect email or password',
            'email': user_email
            }


def sign_in_change_pass():
    return {'error': 'The password reset link is invalid or expired, please try again'}


# Forgot Password Error Messages
def password_weak_forgot(token):
    return {'error': 'Password does not meet minimum requirements (Min. 8 chars, Uppercase, Number, Special Char)',
            'token': token
            }


def password_no_match_forgot(token):
    return {'error': 'Passwords do not match',
            'token': token
            }

def password_db_error(token):
    return {'error': 'An error has occurred, please try submitting again',
            'token': token
            }
