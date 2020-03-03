from typing import (
    Dict,
    List
)
from graphql.language.ast import (
    FragmentDefinition,
    OperationDefinition
)

from backend.security_check import SecurityAnalysisBackend


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
