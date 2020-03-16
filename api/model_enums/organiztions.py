from models import Organizations
from functions.generate_enums import create_enum_with_descriptions

OrganizationsEnum = create_enum_with_descriptions(Organizations, 'OrganizationsEnum', 'acronym', 'org_tags')
