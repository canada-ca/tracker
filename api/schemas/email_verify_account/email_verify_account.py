import graphene
import jwt
import os

from graphql import GraphQLError

from app import app
from db import db_session
from functions.input_validators import cleanse_input
from functions.slugify import slugify_value
from models.Organizations import Organizations
from models.Users import Users
from models.User_affiliations import User_affiliations


class EmailVerifyAccount(graphene.Mutation):
    """

    """
    class Arguments:
        token_string = graphene.String(
            description="Token in sent via email, and located in url",
            required=True
        )

    status = graphene.Boolean(
        description="Informs user if account was successfully verified."
    )

    @staticmethod
    def mutate(self, info, **kwargs):
        token_string = cleanse_input(kwargs.get("token_string"))

        try:
            payload = jwt.decode(
                token_string,
                os.getenv("SUPER_SECRET_SALT"),
                algorithms=["HS256"]
            )
        except jwt.ExpiredSignatureError:
            raise GraphQLError("Signature expired, please login again")
        except jwt.InvalidTokenError:
            raise GraphQLError("Invalid token, please login again")
        user_name = payload.get("user_id")

        with app.app_context():
            # Check to see if user exists
            user = db_session.query(Users).filter(
                Users.user_name == user_name
            )

            if not user.first():
                raise GraphQLError("Error, User does not exist")

            user.update(
                {
                    "email_validated": True
                }
            )

            # Create user sandbox after they have been verified
            acronym = slugify_value(user.first().user_name).upper()[:50]
            new_user_org = Organizations(name=user.first().user_name, acronym=acronym,)
            new_user_aff = User_affiliations(
                permission="admin",
                user=user.first(),
                user_organization=new_user_org
            )
            db_session.add(new_user_org)
            db_session.add(new_user_aff)

            try:
                db_session.commit()
            except Exception as e:
                db_session.rollback()
                db_session.flush()
                raise GraphQLError("Error, unable to verify account.")

        return EmailVerifyAccount(status=True)
