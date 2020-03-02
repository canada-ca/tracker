from graphql.backend.core import GraphQLCoreBackend
from graphql.language.ast import FragmentSpread, FragmentDefinition


def measure_depth(selection_set, level=1):
    """
    This function calculates the depth of queries that have been requested from
    the user.
    :param selection_set: The query requested by a user
    :param level: This is the max depth you want to check for
    :return: Returns the depth of the current selection
    """
    max_depth = level
    for field in selection_set.selections:
        if not isinstance(field, FragmentSpread):
            if field.selection_set:
                new_depth = measure_depth(field.selection_set, level=level + 1)
                if new_depth > max_depth:
                    max_depth = new_depth
    return max_depth


class DepthAnalysisBackend(GraphQLCoreBackend):
    def __init__(self, max_depth=10):
        super().__init__()
        self.max_depth = max_depth

    def document_from_string(self, schema, document_string):
        """
        This function checks to see if the current query maxes the maximum depth
        to prevent complexity attacks
        :param schema: The schema of the application
        :param document_string: The request from the user
        :return: If the test passes it wil return the requested information, if
        the test fails it will raise an exception and inform the user
        """
        document = super().document_from_string(schema, document_string)
        ast = document.document_ast
        for definition in ast.definitions:
            # We are only interested in queries
            if not isinstance(definition, FragmentDefinition):
                if definition.operation != 'query':
                    continue
                if not isinstance(definition, FragmentSpread):
                    depth = measure_depth(definition.selection_set)
                    if depth > self.max_depth:  # set your depth max here
                        raise Exception('Query is too complex')

        return document
