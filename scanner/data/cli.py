import os
import update as data_update
import logger
from models import *
from config import *

LOGGER = logger.get_logger(__name__)

def main() -> None:
    connection = Connection(_db=db_name, _host=db_host, _password=db_passwd, _port=db_port, _user=db_user)

    if not connection.exists():
        connection.create()

    scan(connection)


def scan(connection: Connection) -> None:
    LOGGER.info("Starting scan")
    data_update.update(connection)
    LOGGER.info("Finished scan")

if __name__ == '__main__':
    main()