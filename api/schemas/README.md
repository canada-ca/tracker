# Schemas
This directory contains individual files for each type that you may come across 
in our [GraphQL](https://graphql.org/) API.

### Writing A Single Object
```python
import graphene
from graphene_sqlalchemy import SQLAlchemyObjectType
from sqlalchemy.orm import load_only

from app import app
from db import db
from models import ExampleModel

class SingleObject(SQLAlchemyObjectType):
    class Meta:
            model = ExampleModel
            exclude_fields = (
                "id", "field_1",
                "field_2",
            )
    id = graphene.ID()
    field_1 = graphene.String()
    new_field_1 = graphene.Int()

    with app.app_context():
        def resolve_id(self: ExampleModel, info):
            return self.id

        def resolve_field_1(self: ExampleModel, info):
            return self.field_1

        def resolve_new_field_1(self: ExampleModel, info):
            new_field = db.session.query(NewModel).filter(
                NewModel.ExampleModel_Id == self.id
            ).options(load_only("select_field).first()
            return new_field.select_field
```
This is an example to write a single type object. We use an `SQLAlchemyObjectType` because
it gives us the ability to include this type as a `graphene.List()` in another type
and be related to that entry. One interesting thing is that the self object that is being
passed into the resolve is actually an instance of the model that you are querying.

---

### Writing A Single Object That Contains Another Single Object
```python
import graphene
from graphene_sqlalchemy import SQLAlchemyObjectType
from sqlalchemy.orm import load_only

from app import app
from db import db
from models import ExampleModel, ExampleModel2


class SingleObject(SQLAlchemyObjectType):
    class Meta:
            model = ExampleModel
            exclude_fields = (
                "id", "field_1",
                "field_2",
            )
    id = graphene.ID()
    field_1 = graphene.String()
    new_field_1 = graphene.Int()

    with app.app_context():
        def resolve_id(self: ExampleModel, info):
            return self.id

        def resolve_field_1(self: ExampleModel, info):
            return self.field_1

        def resolve_new_field_1(self: ExampleModel, info):
            new_field = db.session.query(NewModel).filter(
                NewModel.ExampleModel_Id == self.id
            ).options(load_only("select_field).first()
            return new_field.select_field


class ListObject(SQLAlchemyObjectType):
    class Meta:
            model = ExampleModel2
            exclude_fields = (
                "id", "field_1",
            )
    id = graphene.ID()
    new_field_1 = graphene.Int()
    single_object = graphene.List(lambda: SingleObject)

    with app.app_context():
        def resolve_id(self: ExampleModel2, info):
            return self.id

        def resolve_field_1(self: ExampleModel2, info):
            return self.field_1

        def resolve_new_field_1(self: ExampleModel2, info):
            new_field = db.session.query(NewModel).filter(
                NewModel.ExampleModel_Id == self.id
            ).options(load_only("select_field).first()
            return new_field.select_field

        def resolve_single_object(self: ExampleModel2, info):
            query = SingleObject.get_query(info)
            return query
```
If you are creating just a single object type, but want to include a single object type
as a sub-selection you need to create a new field of it as type `graphene.List()` you 
then use a `lambda` and operate that on the object you want to have go in that place.
To resolve the fields you must have all the resovlers you want for that type completed
in its original definition. Then you simply pass the info to that object `query = SingleObject.get_query(info)`

---

### Writing An Object With A Node
```python
import graphene
from graphene import relay
from graphene_sqlalchemy import SQLAlchemyObjectType
from sqlalchemy.orm import load_only

from app import app
from db import db
from models import ExampleModel, ExampleModel2


class NodeQueryObject(SQLAlchemyObjectType):
    class Meta:
            model = ExampleModel
            interfaces = (relay.Node, )
            exclude_fields = (
                "id", "field_1",
                "field_2",
            )
        id = graphene.ID()
        field_1 = graphene.String()
        new_field_1 = graphene.Int()

        with app.app_context():
            def resolve_id(self: ExampleModel, info):
                return self.id

            def resolve_field_1(self: ExampleModel, info):
                return self.field_1

            def resolve_new_field_1(self: ExampleModel, info):
                new_field = db.session.query(NewModel).filter(
                    NewModel.ExampleModel_Id == self.id
                ).options(load_only("select_field).first()
                return new_field.select_field


class NodeQueryObjectConnection(relay.Connection):
    class Meta:
        node = NodeQueryObject


class ListObject(SQLAlchemyObjectType):
    class Meta:
            model = ExampleModel2
            exclude_fields(
                "id", "field_1",
                "field_2",
            )
        id = graphene.ID()
        field_1 = graphene.String()
        new_field_1 = graphene.Int()
        single_object = graphene.ConnectionField(NodeQueryObject._meta.connection)

        with app.app_context():
            def resolve_id(self: ExampleModel2, info):
                return self.id

            def resolve_field_1(self: ExampleModel2, info):
                return self.field_1

            def resolve_new_field_1(self: ExampleModel2, info):
                new_field = db.session.query(NewModel).filter(
                    NewModel.ExampleModel_Id == self.id
                ).options(load_only("select_field).first()
                return new_field.select_field

            def resolve_single_object(self: ExampleModel2, info):
                query = SingleObject.get_query(info)
                return query
```
To include a relay node in a object type we use a `graphene.ConnectionField()` and 
just put in the object `NodeQueryObject._meta.connction` we use the `._meta.connection`
to help the schema understand which connection belongs to which objects or else we may 
encounter a conflict where two objects have the same connection name.

---

### Adding Objects And Relays To Schema
```python
import graphene
from graphene_sqlalchemy import SQLAlchemyConnectionField

from schemas.example import NodeQueryObject, ListObject


class Query(graphene.ObjectType):
    node_query_object = SQLAlchemyConnectionField(NodeQueryObject._meta.connection)
    list_object = graphene.List(lambda: ListObject)

    def resolve_list_object(self, info):
        query = ListObject.get_query(info)
        return query.all()

class Mutation(graphene.ObjectType):
    ...
    ...


schema = graphene.Schema(query=Query, mutation=Mutation)
```
To be able to access these new object types they have to be added to the schema.
If the object is being implemented as a `Node` we want to use the `SQLAlchemyConnectionField`
type with the `._meta.connection`. This will allow you to query this as a `relay.Node`. If you
want to a single object type, it follows the same method as if you were adding it to another
class via the `graphene.List(lambda: Object)` with a resolver querying the `Object.get_query(info)`.
