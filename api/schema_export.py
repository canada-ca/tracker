import json
from queries import schema

# TODO: revisit when Graphene 3 is out, and graphql-core 3 can be used
# instead. This will be much nicer.
# https://graphql-core-next.readthedocs.io/en/latest/usage/introspection.html

introspection_dict = schema.introspect()

with open("schema.json", "w") as fp:
    json.dump(introspection_dict, fp)
