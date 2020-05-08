from typing import Union, Optional, Any
from graphql import GraphQLDocument, GraphQLSchema
from graphql.backend.core import GraphQLCoreBackend
from graphql.language.ast import Document

from backend.depth_check import check_max_depth
from backend.cost_check import check_cost_analysis


class SecurityAnalysisBackend(GraphQLCoreBackend):
    def __init__(self, max_depth=10, max_cost=1000, executor: Optional[Any] = None):
        super().__init__(executor=executor)
        self.max_depth = max_depth
        self.max_cost = max_cost

    def document_from_string(
        self, schema: GraphQLSchema, document_string: Union[Document, str]
    ) -> GraphQLDocument:
        document = super().document_from_string(schema, document_string)
        check_max_depth(max_depth=self.max_depth, document=document.document_ast)
        check_cost_analysis(max_cost=self.max_cost, document=document.document_ast)
        return document
