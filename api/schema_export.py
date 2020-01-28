import json
from queries import schema

introspection_dict = schema.introspect()

with open("schema.json", "w") as fp:
    json.dump(introspection_dict, fp)
