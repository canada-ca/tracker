import logging
import logging.config
from graphql import GraphQLError


class GraphQLLogFilter(logging.Filter):
    """
    Filter GraphQL errors that are intentional. See
    https://github.com/graphql-python/graphene/issues/513
    """

    def filter(self, record):
        if record.exc_info:
            etype, _, _ = record.exc_info
            if etype == GraphQLError:
                return None
        if record.stack_info and "GraphQLError" in record.stack_info:
            return None
        if record.msg and "GraphQLError" in record.msg:
            return None
        if record.msg and "GraphQLLocatedError" in record.msg:
            return None
        if record.msg and "Traceback" in record.msg:
            return None
        return True


logger_dict = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {"console": {"level": "DEBUG", "class": "logging.StreamHandler",},},
    # Prevent graphql exception from displaying in console
    "filters": {"graphql_error_log_filter": {"()": GraphQLLogFilter,},},
    "loggers": {
        "graphql.execution.executor": {
            "level": "WARNING",
            "handlers": ["console"],
            "filters": ["graphql_error_log_filter",],
        },
        "graphql.execution.utils": {
            "level": "WARNING",
            "handlers": ["console"],
            "filters": ["graphql_error_log_filter",],
        },
    },
}

logging.config.dictConfig(logger_dict)
logger = logging.getLogger("TrackerAPI")
