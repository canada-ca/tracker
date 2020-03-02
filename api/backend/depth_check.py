from typing import (
    Union,
    Optional,
    Any,
    Dict,
    List
)
from graphql import GraphQLDocument, GraphQLSchema
from graphql.backend.core import GraphQLCoreBackend
from graphql.language.ast import (
    Document,
    FragmentSpread,
    FragmentDefinition,
    OperationDefinition,
    Node,
    FragmentSpread,
    Field,
    InlineFragment
)


class DepthLimitReached(Exception):
    pass


def get_fragments(definitions) -> Dict[str, FragmentDefinition]:
    return {
        definition.name.value: definition
        for definition in definitions
        if isinstance(definition, FragmentDefinition)
    }


def get_queries_and_mutations(definitions) -> List[OperationDefinition]:
    return [
        definition
        for definition in definitions
        if isinstance(definition, OperationDefinition)
    ]


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
            raise DepthLimitReadched(
                'Query is too complex'
            )


class DepthAnalysisBackend(GraphQLCoreBackend):
    def __init__(self, max_depth=10, executor: Optional[Any] = None):
        super().__init__(executor=executor)
        self.max_depth = max_depth

    def document_from_string(self, schema: GraphQLSchema, document_string: Union[Document, str]) -> GraphQLDocument:
        document = super().document_from_string(schema, document_string)
        check_max_depth(max_depth=self.max_depth, document=document.document_ast)
        return document
