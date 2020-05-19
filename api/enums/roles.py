import graphene


class RoleEnums(graphene.Enum):
    USER_READ = "user_read"
    USER_WRITE = "user_write"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"

    @property
    def description(self):
        if self == RoleEnums.USER_READ:
            return "A user who has been given access to view results"
        elif self == RoleEnums.USER_WRITE:
            return (
                "A user who has been given access to run scans, and " "manage domains"
            )
        elif self == RoleEnums.ADMIN:
            return (
                "A user who has the same access as a user write account, "
                "but can define new user write accounts"
            )
        elif self == RoleEnums.SUPER_ADMIN:
            return (
                "A user who has the same access as an admin, but can "
                "define new admins"
            )
        else:
            return "Another Role"
