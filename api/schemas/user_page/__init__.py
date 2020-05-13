import graphene

from schemas.user_page.user_page_resolver import resolve_user_page
from schemas.user_page.user_page import UserPage
from scalars.email_address import EmailAddress

user_page = graphene.Field(
    lambda: UserPage,
    user_name=graphene.Argument(
        EmailAddress,
        description="Users user name/email address"
    ),
    description="An graphql object that will be used to populate a "
                "userPage component in the front end"
)
