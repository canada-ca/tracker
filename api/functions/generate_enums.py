import graphene
import enum
from sqlalchemy.orm import load_only
from model_enums import create_enum_app, create_enum_db


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
        ret_enum = enum.Enum(enum_name, 'EMPTY')
    else:
        ret_enum = enum.Enum(enum_name, enum_dict)

    return graphene.Enum.from_enum(ret_enum)


def create_enum_with_descriptions(Table, enum_name, enum_column, description_column):
    """
    Function to allow the creation of enums with descriptions for various uses. Function takes in SQLAlchemy Model,
    and the Column that you would like your enums to be created. The value of the enum is equal to that of the name
    """

    app = create_enum_app()
    db = create_enum_db(app)

    with app.app_context():
        query = db.session.query(Table).options(load_only(enum_column))
        rows = db.session.execute(query).fetchall()

    enum_dict = dict()

    for select in rows:
        enum_dict.update({select[1]: select[1]})

    if not len(enum_dict):
        ret_enum = enum.Enum(enum_name, 'EMPTY')
    else:
        ret_enum = enum.Enum(enum_name, enum_dict)

    description_dict = dict()

    for e in ret_enum:
        with app.app_context():
            query = db.session.query(Table).filter(
                getattr(Table, enum_column) == e.name).options(
                    load_only(description_column))
            row = db.session.execute(query).first()

            try:
                description_dict.update({e.name: row[1]})
            except:
                description_dict.update({e.name: "Error loading description"})

        @property
        def description(self):
            return description_dict.get(self.name)

        setattr(ret_enum, 'description', description)

    return graphene.Enum.from_enum(ret_enum)

# Example of how to create enums for a given table
# from functions.generate_enums import create_enums
# from models import Groups
#
# GroupEnums = create_enums(Groups, 'GroupEnums', 's_group')

# Put this above other file import in the test files
# import model_enums
# model_enums._called_from_test = True
