import enum
from sqlalchemy.orm import load_only
from model_enums import app, db
from models import *


def create_enums(Table, column):
	with app.app_context():
		query = db.session.query(Table).options(load_only(column))
		rows = db.session.execute(query).fetchall()

	enum_dict = dict()

	for select in rows:
		enum_dict.update({select[1]: select[1]})

	return enum.Enum(column, enum_dict)