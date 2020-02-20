from models import Sectors
from functions.generate_enums import create_enum_with_descriptions

SectorEnums = create_enum_with_descriptions(Sectors, 'SectorEnums', 'sector', 'description')
ZoneEnums = create_enum_with_descriptions(Sectors, 'ZoneEnums', 'zone', 'description')
