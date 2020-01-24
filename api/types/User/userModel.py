from sqlalchemy.types import Integer
from sqlalchemy import Column, String

from ...models import base


class Users(base):
	__tablename__ = 'users'

	id = Column(Integer, primary_key=True, autoincrement=True)
	username = Column(String)
	display_name = Column(String)
	user_email = Column(String)
	user_password = Column(String)
	preferred_lang = Column(String)
	failed_login_attempts = Column(Integer)

