#!/usr/bin/env python3
import json
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
DEVCONTAINER_DIR = REPO_ROOT / ".devcontainer"
K8S_BASES = REPO_ROOT / "k8s" / "infrastructure" / "bases"

DEV_DOCKERFILE = DEVCONTAINER_DIR / "Dockerfile"
DEV_COMPOSE = DEVCONTAINER_DIR / "docker-compose.yml"
DEV_CONTAINER_JSON = DEVCONTAINER_DIR / "devcontainer.json"

API_DOCKERFILE = REPO_ROOT / "api" / "Dockerfile"
FRONTEND_DOCKERFILE = REPO_ROOT / "frontend" / "Dockerfile"
FINDINGS_PROCESSOR_DOCKERFILE = REPO_ROOT / "scanners" / "findings-processor" / "Dockerfile"
WEB_SCANNER_DOCKERFILE = REPO_ROOT / "scanners" / "web-scanner" / "Dockerfile"
ARANGO_MANIFEST = K8S_BASES / "arangodb" / "arangodb-deployment.yaml"
NATS_MANIFEST = K8S_BASES / "nats" / "statefulset.yaml"


def find(pattern: str, path: Path) -> str | None:
    match = re.search(pattern, path.read_text(), re.MULTILINE)
    return match.group(1) if match else None


def base_image_tag(dockerfile: Path, image: str) -> str | None:
    return find(rf"^FROM {re.escape(image)}:(\S+)", dockerfile)


def yaml_image_tag(yaml_file: Path, image: str) -> str | None:
    return find(rf"image:\s*{re.escape(image)}:(\S+)", yaml_file)


def build_arg(dockerfile: Path, name: str) -> str | None:
    return find(rf"^ARG {name}=(\S+)", dockerfile)


def feature_version(feature: str) -> str | None:
    features = json.loads(DEV_CONTAINER_JSON.read_text()).get("features", {})
    for feature_id, options in features.items():
        if feature_id.startswith(f"ghcr.io/devcontainers/features/{feature}:"):
            return options.get("version")
    return None


def major(version: str | None) -> str | None:
    match = re.match(r"\d+", version or "")
    return match.group(0) if match else None


def major_minor(version: str | None) -> str | None:
    match = re.match(r"\d+\.\d+", version or "")
    return match.group(0) if match else None


def check(name: str, expected: str | None, actual: str | None, source: Path | str) -> bool:
    if isinstance(source, Path):
        source = source.relative_to(REPO_ROOT)
    if expected is None or actual is None:
        print(f"ERROR    {name}: could not read a version (expected={expected!r} from {source}, devcontainer={actual!r})")
        return False
    if expected != actual:
        print(f"MISMATCH {name}: {source} uses {expected}, .devcontainer uses {actual}")
        return False
    print(f"OK       {name}: {actual}")
    return True


def main() -> int:
    results = [
        check(
            "Python (PQC environment)",
            expected=major_minor(find(r"^FROM python:(\S+)\s+AS experimental-builder", WEB_SCANNER_DOCKERFILE)),
            actual=major_minor(find(r"devcontainers/python:(\S+)", DEV_DOCKERFILE)),
            source=WEB_SCANNER_DOCKERFILE,
        ),
        check(
            "Node (api)",
            expected=major(base_image_tag(API_DOCKERFILE, "node")),
            actual=feature_version("node"),
            source=API_DOCKERFILE,
        ),
        check(
            "Node (frontend)",
            expected=major(base_image_tag(FRONTEND_DOCKERFILE, "node")),
            actual=feature_version("node"),
            source=FRONTEND_DOCKERFILE,
        ),
        check(
            "Go",
            expected=major_minor(base_image_tag(FINDINGS_PROCESSOR_DOCKERFILE, "golang")),
            actual=feature_version("go"),
            source=FINDINGS_PROCESSOR_DOCKERFILE,
        ),
        check(
            "ArangoDB",
            expected=major_minor(yaml_image_tag(ARANGO_MANIFEST, "arangodb/arangodb")),
            actual=major_minor(yaml_image_tag(DEV_COMPOSE, "arangodb")),
            source=ARANGO_MANIFEST,
        ),
        check(
            "NATS",
            expected=major_minor(yaml_image_tag(NATS_MANIFEST, "nats")),
            actual=major_minor(yaml_image_tag(DEV_COMPOSE, "nats")),
            source=NATS_MANIFEST,
        ),
        check(
            "rust-query-crlite",
            expected=find(r"rust-query-crlite --tag (\S+)", WEB_SCANNER_DOCKERFILE),
            actual=build_arg(DEV_DOCKERFILE, "CRLITE_TAG"),
            source=WEB_SCANNER_DOCKERFILE,
        ),
        check(
            "nassl",
            expected=build_arg(WEB_SCANNER_DOCKERFILE, "NASSL_REF"),
            actual=build_arg(DEV_DOCKERFILE, "NASSL_REF"),
            source=WEB_SCANNER_DOCKERFILE,
        ),
        check(
            "sslyze",
            expected=build_arg(WEB_SCANNER_DOCKERFILE, "SSLYZE_REF"),
            actual=build_arg(DEV_DOCKERFILE, "SSLYZE_REF"),
            source=WEB_SCANNER_DOCKERFILE,
        ),
    ]
    return 0 if all(results) else 1


if __name__ == "__main__":
    sys.exit(main())
