import graphene
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


def create_enums(Table, enum_name, column):
	"""
	Function to allow the creation of enums for various uses. Function takes in SQLAlchemy Model, and the
	Column that you would like your enums to be created. The value of the enum is equal to that of the name
	"""
	app = create_enum_app()
	db = create_enum_db(app)

	with app.app_context():
		query = db.session.query(Table).options(load_only(column))
		rows = db.session.execute(query).fetchall()

	enum_dict = dict()

	for select in rows:
		enum_dict.update({select[1]: select[1]})

	if not len(enum_dict):
		return graphene.Enum(enum_name, 'EMPTY')
	else:
		return graphene.Enum(enum_name, enum_dict)

# Example of how to create enums for a given table
# from functions.generate_enums import create_enums
# from models import Groups
#
# GroupEnums = create_enums(Groups, 'GroupEnums', 's_group')

# Put this above other file import in the test files
# import model_enums
# model_enums._called_from_test = True
