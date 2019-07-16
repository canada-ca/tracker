import typing
from click.testing import CliRunner
import _pytest
import pytest
from data import cli
from data import update
from data import processing


@pytest.fixture(params=[('2018-04-24', 0), ('BAD_DATE', 2)])
def date_result(request: _pytest.fixtures.SubRequest) -> typing.Tuple[str, int]:
    return request.param


def noop(*args) -> None: # pylint: disable=unused-argument
    pass


def test_transform_args() -> None:
    args = ['--lambda', '--lambda-profile', 'profile']
    assert cli.transform_args(args) == {
        'lambda': True,
        'lambda-profile': 'profile'
    }


def test_run_all_args(
        date_result: typing.Tuple[str, int],
        monkeypatch: _pytest.monkeypatch.MonkeyPatch,
    ) -> None:
    monkeypatch.setattr(update, 'update', noop)
    monkeypatch.setattr(processing, 'run', noop)

    date, exit_code = date_result

    runner = CliRunner()
    result = runner.invoke(cli.main, args=[
        'run',
        '--date', date,
        '--scanner', 'pshtt',
        '--scanner', 'sslyze',
        '--domains', 'not.a.real.file',
        '--output', '.'
    ])
    assert result.exit_code == exit_code


def test_update(monkeypatch: _pytest.monkeypatch.MonkeyPatch) -> None:
    monkeypatch.setattr(update, 'update', noop)

    runner = CliRunner()
    result = runner.invoke(cli.main, args=[
        'scan',
        '--scanner', 'pshtt',
        '--scanner', 'sslyze',
        '--domains', 'not.a.real.file',
        '--output', '.'
    ])
    assert result.exit_code == 0


def test_process(
        date_result: typing.Tuple[str, int],
        monkeypatch: _pytest.monkeypatch.MonkeyPatch,
    ) -> None:

    date, exit_code = date_result

    monkeypatch.setattr(processing, 'run', noop)

    runner = CliRunner()
    result = runner.invoke(cli.main, args=[
        'process',
        '--date', date,
    ])
    assert result.exit_code == exit_code
