#!/usr/bin/env python
import argparse
import importlib
import contextlib
import pathlib
import typing
import sys
from unittest import mock

import setuptools

@contextlib.contextmanager
def in_path(path: pathlib.Path):
    sys.path.insert(0, str(path))
    yield
    sys.path.pop(0)


def extract_setup_requires(setup_path: pathlib.Path) -> typing.Set[str]:
    with setup_path.open('r', encoding='utf-8-sig') as setup:
        content = setup.read()

    with in_path(setup_path.parent), mock.patch.object(setuptools, 'setup') as mock_setup:
        importlib.import_module(setup_path.with_suffix('').name)
        args, kwargs = mock_setup.call_args
        return set(kwargs.get('install_requires', []))


def extract_txt_requires(requirements_path: pathlib.Path) -> typing.Set[str]:
    with requirements_path.open('r', encoding='utf-8-sig') as req:
        requirements = set(line.rstrip('\n') for line in req.readlines())
        requirements.discard('-e .')
        requirements.discard('')
        return requirements


def are_syncd(*paths: pathlib.Path) -> bool:
    '''Verifies that dependencies in the `paths` are synced
    '''
    reqs = iter(
        [extract_setup_requires(path) if path.suffix == '.py' else extract_txt_requires(path) for path in paths]
    )
    first = next(reqs, None)
    return all(first == other for other in reqs)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('path', type=str, nargs='+')
    args = parser.parse_args()
    return not are_syncd(*[pathlib.Path(path) for path in args.path])


if __name__ == '__main__':
    exit(main())
