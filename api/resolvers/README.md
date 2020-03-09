## Resolvers
This directory contains various resolvers for resolving user queries, allowing the 
enforcement of access control, and filtration. You can view the 
[GraphQL Docs](https://graphql.org/learn/execution/) for a more in depth explanation.

#### Example Resolver
```python
@require_token
def resolve_information(self, info, **kwargs):
    # Get information passed in from kwargs
    id = kwargs.get('id')
    user_role = kwargs.get('user_roles')

```

