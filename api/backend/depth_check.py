from typing import Dict
from graphql.language.ast import (
    Document,
    FragmentDefinition,
    OperationDefinition,
    Node,
    FragmentSpread,
    Field,
    InlineFragment,
)

from backend import get_fragments, get_queries_and_mutations


class DepthLimitReached(Exception):
    pass


def measure_depth(node: Node, fragments: Dict[str, FragmentDefinition]) -> int:
    """
    A function which recursively measures the depth of a Graphene Query
    :type node: Node
    :param node: Graphql-core object used for query traversal/indexing
    :type fragments: dict
    :param fragments: The fragments of the query
    :rtype: int
    :return: The max depth of the node
    """
    if isinstance(node, FragmentSpread):
        fragment = fragments.get(node.name.value)
        return measure_depth(node=fragment, fragments=fragments)

    elif isinstance(node, Field):
        if node.name.value.lower() in ["__schema", "__introspection"]:
            return 0
        if not node.selection_set:
            return 1
        depths = []
        for selection in node.selection_set.selections:
            depth = measure_depth(node=selection, fragments=fragments)
            depths.append(depth)
        return 1 + max(depths)
    elif (
        isinstance(node, FragmentDefinition)
        or isinstance(node, OperationDefinition)
        or isinstance(node, InlineFragment)
    ):
        depths = []
        for selection in node.selection_set.selections:
            depth = measure_depth(node=selection, fragments=fragments)
            depths.append(depth)
        return max(depths)
    else:
        raise Exception("Unknown node")


def check_max_depth(max_depth: int, document: Document):
    fragments = get_fragments(document.definitions)
    queries = get_queries_and_mutations(document.definitions)

    for query in queries:
        depth = measure_depth(query, fragments)
        if depth > max_depth:
            raise DepthLimitReached("Query is too complex")
