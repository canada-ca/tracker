import os
from db import db_session
from models import User_affiliations, Users, Organizations

SA_USER_NAME = os.getenv("SA_USER_NAME")
SA_PASSWORD = os.getenv("SA_PASSWORD")
SA_DISPLAY_NAME = os.getenv("SA_DISPLAY_NAME")


def create_sa():
    user_orm = db_session.query(Users).filter(Users.user_name == SA_USER_NAME).first()

    if user_orm is None:
        new_user = Users(
            user_name=SA_USER_NAME,
            display_name=SA_DISPLAY_NAME,
            password=SA_PASSWORD,
            preferred_lang="english",
            failed_login_attempt_time=0,
            failed_login_attempts=0,
            tfa_validated=False,
        )
        db_session.add(new_user)
        db_session.commit()

    org_orm = (
        db_session.query(Organizations).filter(Organizations.acronym == "SA").first()
    )

    if org_orm is None:
        new_org = Organizations(
            acronym="SA", org_tags={"description": "Super Admin Organization"}
        )
        db_session.add(new_org)
        db_session.commit()

    user_orm = db_session.query(Users).filter(Users.user_name == SA_USER_NAME).first()
    org_orm = (
        db_session.query(Organizations).filter(Organizations.acronym == "SA").first()
    )

    if org_orm is not None and user_orm is not None:
        user_aff_orm = (
            db_session.query(User_affiliations)
            .filter(User_affiliations.user_id == user_orm.id)
            .filter(User_affiliations.organization_id == org_orm.id)
            .first()
        )

        if user_aff_orm is None:
            new_user_aff = User_affiliations(
                organization_id=org_orm.id,
                user_id=user_orm.id,
                permission="super_admin",
            )
            db_session.add(new_user_aff)
            db_session.commit()
            print("Created Super Admin User")
