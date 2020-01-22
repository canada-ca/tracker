import os
import update as data_update
import logger
import models
from config import *

LOGGER = logger.get_logger(__name__)

def main() -> None:
    connection = models.Connection(_db=db_name, _host=db_host, _password=db_passwd, _port=db_port, _user=db_user)

    scan(connection)
    connection.commit()


def scan(connection: models.Connection) -> None:
    LOGGER.info("Starting scan")
    data_update.update(connection)
    LOGGER.info("Finished scan")

if __name__ == '__main__':
    main()