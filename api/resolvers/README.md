## Resolvers
This directory contains various resolvers for resolving user queries, allowing the 
enforcement of access control, and filtration. You can view the 
[GraphQL Docs](https://graphql.org/learn/execution/) for a more in depth explanation.

#### Example Resolver
```python
# File:  api/resolvers/domains.py

@require_token
def resolve_domains(self, info, **kwargs):
    # Get Information passed in from kwargs
    organization = kwargs.get('organization')
    user_role = kwargs.get('user_roles')

    # Generate list of org's the user has access to
    org_id_list = []
    for role in user_role:
        org_id_list.append(role["org_id"])

    if not org_id_list:
        raise GraphQLError("Error, you have not been assigned to any organization")

    # Retrieve information based on query
    query = Domain.get_query(info)

    if organization:
        # Retrieve org id from organization enum
        with app.app_context():
            org_orm = db.session.query(Organizations).filter(
                Organizations.organization == organization
            ).options(load_only('id'))

        # Check if org exists
        if not len(org_orm.all()):
            raise GraphQLError("Error, no organization associated with that enum")

        # Convert to int id
        org_id = org_orm.first().id

        # Check if user is super admin, and if true return all domains belonging to
        # that domain
        if is_super_admin(user_role=user_role):
            query_rtn = query.filter(
                Domains.organization_id == org_id
            ).all()

            # If org has no domains related to it
            if not len(query_rtn):
                raise GraphQLError(
                    "Error, no domains associated with that organization")
        # If user fails super admin test
        else:
            # Check if user has permission to view org
            if is_user_read(user_role, org_id):
                query_rtn = query.filter(
                    Domains.organization_id == org_id
                ).all()
            else:
                raise GraphQLError(
                    "Error, you do not have permission to view that organization")

        return query_rtn
    else:
        if is_super_admin(user_role=user_role):
            query_rtn = query.all()
            if not query_rtn:
                raise GraphQLError("Error, no domains to view")
            return query_rtn
        else:
            query_rtr = []
            for org_id in org_id_list:
                if is_user_read(user_role, org_id):
                    tmp_query = query.filter(
                        Domains.organization_id == org_id
                    ).first()
                    query_rtr.append(tmp_query)
            return query_rtr
```
This example is a copy of our `domain(url: URL!)` resolver. This resolver requires that an argument be
included in the query setup but that will be covered later on in this document. Working from top to 
bottom this file will take in the request sent in by the user, after its been cleared by the backend
and we can process the request.
<br /><br />
##### Gather Information From Arguments
We first gather the arguments that have been passed in through `kwargs`. `user_roles` is a special 
case because it has actually been passed to the resolver through the `@required_token` wrapper 
function. 
```python
    # Get Information passed in from kwargs
    organization = kwargs.get('organization')
    user_role = kwargs.get('user_roles')
```  

##### Generating User Access List
The next step of the resolver is to gather all of the org id's that the user has access to so we are 
able to pass it into the auth check functions. This is simply done by iterating through the list of 
dictionary's inside the `user_role` list.
```python
    # Generate list of org's the user has access to
    org_id_list = []
    for role in user_role:
        org_id_list.append(role["org_id"])
```

##### Gathering Initial Request
To be able to filter the results for each user, we first need to gather all the information that has
been requested in the query that was sent in by the user. We do this by requesting the information
through a `get_query()` statement, and passing in the `info` argument that was passed in, in the 
query object. 
```python
    # Get initial Domain Query Object
    query = Domain.get_query(info)
```

##### Check If Argument Has Been Filled
Because the `organiztion` argument is not a required field, we need to check to see if it was
included because it will depend on how we filter the results that are returned to the user.
```python
    if organization:
        ...
        ...
```

##### Verify Organization Still Exists
We need to verify that the organization is still existing incase an admin has come along and removed
it without the user refreshing his data. If the organization is found we then also grab the ID for
later.
```python
        # Retrieve org id from organization enum
        with app.app_context():
            org_orm = db.session.query(Organizations).filter(
                Organizations.organization == organization
            ).options(load_only('id'))

        # Check if org exists
        if not len(org_orm.all()):
            raise GraphQLError("Error, no organization associated with that enum")

        # Convert to int id
        org_id = org_orm.first().id
```

##### Check If The User Is A Super User
In our application we have a role of `Super User` any user with this role has access to all the
information that is retrievable through the API. For this reason all we need to do is to check
if they are a `Super User`, if it is found to be that they are a super user we then filter the
results based on the optional argument that was passed in.
```python
        # Check if user is super admin, and if true return all domains belonging to
        # that domain
        if is_super_admin(user_role=user_role):
            query_rtn = query.filter(
                Domains.organization_id == org_id
            ).all()

            # If org has no domains related to it
            if not len(query_rtn):
                raise GraphQLError("Error, no domains associated with that organization")
```

##### Check User Has Read Access
To verify that a user actually has the ability to view the information related to that organization
we use the `is_user_read(user_role, org_id)` check. This will ensure that the user has the proper
rights to view this information. We then filter it to only return the information that is related to
the requested organization.
```python
        # Check if user has permission to view org
        if is_user_read(user_role, org_id):
            query_rtn = query.filter(
                Domains.organization_id == org_id
            ).all()
        else:
            raise GraphQLError("Error, you do not have permission to view that organization")
```

##### Returning Information
We then simply return the filtered information back to the Query class which then gets parsed and 
sent to the user who requested it.
```python
    return query_rtn
```

##### No Argument Sent (Super Admin)
If the user left the `organization` argument empty we will assume that they are requesting all the
domains that they have access to. To do this we follow the same steps as before, firstly we see
if the user has `Super User` access which then we send all the domains that belong to all the 
organizations.
```python
        if is_super_admin(user_role=user_role):
            query_rtn = query.all()
            if not query_rtn:
                raise GraphQLError("Error, no domains to view")
            return query_rtn
```

##### No Argument Sent (User Read)
If the user left the `organization` argument empty we will assume that they are requesting all the
domains that they have access to. Because we are checking for a user who does not have `Super User`
we will have to filter out the results based on the claims that they sent in. To accomplish this
we double check that they have access in the requested organization, and then filter the results
based on that organization, and append it to a list of ORM's that get passed back to the parser.
```python
            query_rtr = []
            for org_id in org_id_list:
                if is_user_read(user_role, org_id):
                    tmp_query = query.filter(
                        Domains.organization_id == org_id
                    ).first()
                    query_rtr.append(tmp_query)
            return query_rtr
```

### Query Class Design
```python
# File api/queries.py
class Query(graphene.ObjectType):
    """The central gathering point for all of the GraphQL queries."""

    domains = SQLAlchemyConnectionField(
        Domain._meta.connection,
        organization=graphene.Argument(OrganizationsEnum, required=False),
        sort=None,
        description="Select information on an organizations domains, or all "
                    "domains a user has access to. "
    )
```
This is a small piece from our `Query` class that includes the important information for adding
a resolver for a query. To actually have the ability to query a relay connection we need to use
the `SQLAlchemyConnectionField` class and pass in some information.
#### Creating Query
##### Set Schema Model
First we need to send it the actual `SQLAlchemyObjectType` class that we are using, we use the 
`._meta.connection` to ensure that we do not have a duplication error from the GraphQL server-core. 
```python
Domain._meta.connection,
``` 
##### Set Arguments
We then create an argument, this can be of any type that pertains to the request you would like to 
create, here we are asking for an `organization` of type `OrganizationsEnm` this will limit the 
user to send a request if there is actually an enum for that organization. To make this optional as 
we have defined in our resolver function we set the `required=False` property to false. 
```python
organization=graphene.Argument(OrganizationsEnum, required=False)
```
##### Set Sorting
You are also able to sort this in any manner that you want, but for now we are just going to leave 
it set to `None`. 
```python
sort=None
```

##### Set Description
To have text generate for this object in the GraphQLi Docs we need to add the `description` property 
and set a string value of what we want the description to say. 
```python
description="Select information on an organizations domains, or all domains a user has access to."
```

#### Creating Resolver
```python
    with app.app_context():
        def resolve_domains(self, info, **kwargs):
            return resolve_domains(self, info, **kwargs)
```
To resolve the query with our filtered material we add this statement in right after the connection
object that we just created. We use `with app.app_context()` to ensure that there are no database
session errors occur. We then name the function `resolve_(name of List, Field, or Connection)`
this will then automatically connect the two and use it to resolve. We use the `self, info, **kwargs`
as our arguments for the object so that they can be passed into the resolver function for our use.
