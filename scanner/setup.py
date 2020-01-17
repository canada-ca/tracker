import sys
import os

if __name__ == '__main__':

    try:
        os.system("sudo apt-get install -y python3-pip")
    except Exception as e:
        print(f'Error occurred while installing pip3: {str(e)}')

    _cmd = "pip3 install"
    if not 'pyyaml' in sys.modules:
        _cmd = _cmd + " pyyaml"
    if not 'pymongo' in sys.modules:
        _cmd = _cmd + " pymongo"
    if not 'ujson' in sys.modules:
        _cmd = _cmd + " ujson"
    if not 'dkimpy' in sys.modules:
        _cmd = _cmd + " dkimpy"
    if not 'celery' in sys.modules:
        _cmd = _cmd + " celery"
    if not 'kombu' in sys.modules:
        _cmd = _cmd + " kombu"
    if not 'pshtt' in sys.modules:
        _cmd = _cmd + " pshtt"
    if not 'sslyze' in sys.modules:
        _cmd = _cmd + " sslyze"
    if not 'sqlalchemy' in sys.modules:
        _cmd = _cmd + " sqlalchemy"
    if not 'postgres' in sys.modules:
        _cmd = _cmd + " postgres"
    if not 'redis' in sys.modules:
        _cmd = _cmd + " redis"

    try:
        os.system(_cmd)
    except Exception as e:
        print(f'Error occurred while installing requirements: {str(e)}')

    print('Done!')