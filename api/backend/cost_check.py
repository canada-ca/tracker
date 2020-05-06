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

from backend.cost_map import cost_map


class CostLimitReached(Exception):
    pass


def measure_cost(node: Node, fragments: Dict[str, FragmentDefinition]) -> int:
    """
    A function which recursively measures the cost of a Graphene Query
    :type node: Node
    :param node: Graphql-core object used for query traversal/indexing
    :type fragments: dict
    :param fragments: The fragments of the query
    :rtype: int
    :return: The cost of the node
    """
    if isinstance(node, FragmentSpread):
        fragment = fragments.get(node.name.value)
        return measure_cost(node=fragment, fragments=fragments)

    elif isinstance(node, Field):
        if node.name.value.lower() in ["__schema", "__introspection"]:
            return 0
        if not node.selection_set:
            return cost_map.get(node.name.value, 1)
        costs = []
        for selection in node.selection_set.selections:
            cost = measure_cost(node=selection, fragments=fragments)
            costs.append(cost)
        return sum(costs) + cost_map.get(node.name.value, 1)
    elif (
        isinstance(node, FragmentDefinition)
        or isinstance(node, OperationDefinition)
        or isinstance(node, InlineFragment)
    ):
        costs = []
        for selection in node.selection_set.selections:
            cost = measure_cost(node=selection, fragments=fragments)
            costs.append(cost)
        return sum(costs)
    else:
        raise Exception("Unknown node")


def check_cost_analysis(max_cost: int, document: Document):
    fragments = get_fragments(document.definitions)
    queries = get_queries_and_mutations(document.definitions)

    for query in queries:
        total_cost = measure_cost(query, fragments)
        if total_cost > max_cost:
            raise CostLimitReached("Query cost is too high")
