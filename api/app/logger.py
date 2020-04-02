import logging
import logging.config
from graphql import GraphQLError


class GraphQLErrorLogFilter(logging.Filter):
    def filter(self, record):
        exc_type, exc, _ = record.exc_info
        graphql_error = isinstance(exc, GraphQLError)
        if graphql_error:
            return False
        return True


class GraphQLLocatedLogFilter(logging.Filter):
    def filter(self, record):
        if 'graphql.error.located_error.GraphQLLocatedError:' in record.msg:
            return False
        return True


class GraphQLTracebackLogFilter(logging.Filter):
    def filter(self, record):
        if 'graphql.execution.utils:Traceback (most recent call last):' in record.msg:
            return False
        return True


logger_dict = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
        },
    },
    # Prevent graphql exception from displaying in console
    'filters': {
        'graphql_error_log_filter': {
            '()': GraphQLErrorLogFilter,
        },
        'graphql_located_error_filter': {
            '()': GraphQLLocatedLogFilter
        },
        'graphql_traceback_error_filter': {
            '()': GraphQLTracebackLogFilter
        }
    },
    'loggers': {
        'graphql.execution.executor': {
            'level': 'WARNING',
            'handlers': ['console'],
            'filters': [
                'graphql_error_log_filter',
                'graphql_located_error_filter',
                'graphql_traceback_error_filter',
            ],
        },
    },
}

logging.config.dictConfig(logger_dict)
logger = logging.getLogger('custom')

