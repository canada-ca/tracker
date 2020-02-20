from models import Groups
from functions.generate_enums import create_enum_with_descriptions

GroupEnums = create_enum_with_descriptions(Groups, 'GroupEnums', 's_group', 'description')
