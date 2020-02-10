import enum
from sqlalchemy.orm import load_only
from model_enums import create_enum_app, create_enum_db
from models import (
	Admin_affiliations,
	Admins,
	Ciphers,
	Classification,
	Dkim_scans,
	Dmarc_scans,
	Domains,
	Groups,
	Guidance,
	Https_scans,
	Organizations,
	Scans,
	Sectors,
	Spf_scans,
	Ssl_scans,
	User_affiliations,
	Users
)

app = create_enum_app()
db = create_enum_db(app)


def create_enums(Table, column):
	"""
	Function to allow the creation of enums for various uses. Function takes in SQLAlchemy Model, and the
	Column that you would like your enums to be created. The value of the enum is equal to that of the name
	"""
	with app.app_context():
		query = db.session.query(Table).options(load_only(column))
		rows = db.session.execute(query).fetchall()

	enum_dict = dict()

	for select in rows:
		enum_dict.update({select[1]: select[1]})

	if not len(enum_dict):
		return enum.Enum(column, 'EMPTY')
	else:
		return enum.Enum(column, enum_dict)
