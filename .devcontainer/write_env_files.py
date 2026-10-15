#!/usr/bin/env python3
import secrets
import sys
from pathlib import Path

DEVCONTAINER_DIR = Path(__file__).resolve().parent
REPO_ROOT = DEVCONTAINER_DIR.parent

DEV_ENV = DEVCONTAINER_DIR / "dev.env"
API_TEST_ENV = DEVCONTAINER_DIR / "api-test.env"
API_DIR = REPO_ROOT / "api"

GENERATED_KEY_LENGTHS = {
    "SIGN_IN_KEY": 64,
    "REFRESH_KEY": 64,
    "AUTHENTICATED_KEY": 64,
    "CIPHER_KEY": 32,
}


def read_env(path: Path) -> dict[str, str]:
    values = {}
    for line in path.read_text().splitlines():
        key, separator, value = line.partition("=")
        if separator and not key.startswith("#"):
            values[key.strip()] = value.strip()
    return values


def generated_keys() -> dict[str, str]:
    return {key: secrets.token_hex(length // 2) for key, length in GENERATED_KEY_LENGTHS.items()}


def write_env(example: Path, target: Path, values: dict[str, str]) -> None:
    if target.exists():
        print(f"    kept existing {target.relative_to(REPO_ROOT)}")
        return

    lines = []
    for line in example.read_text().splitlines():
        key = line.partition("=")[0].strip()
        lines.append(f"{key}={values[key]}" if key in values else line)

    target.write_text("\n".join(lines) + "\n")
    print(f"    wrote {target.relative_to(REPO_ROOT)}")


def main() -> None:
    dev_values = read_env(DEV_ENV)

    for service_dir in (REPO_ROOT / arg for arg in sys.argv[1:]):
        write_env(service_dir / ".env.example", service_dir / ".env", dev_values | generated_keys())

    write_env(
        API_DIR / ".env.example",
        API_DIR / "test.env",
        dev_values | generated_keys() | read_env(API_TEST_ENV),
    )


if __name__ == "__main__":
    main()
