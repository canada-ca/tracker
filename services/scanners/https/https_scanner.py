import os
import sys
import logging
from scan import https
from pebble import concurrent

logging.basicConfig(stream=sys.stdout, level=logging.INFO)

TIMEOUT = os.getenv("SCAN_TIMEOUT", 80)


class HTTPSScanner():
    domain = None


    def __init__(self, target_domain):
        self.domain = target_domain


    @concurrent.process(timeout=TIMEOUT)
    def run(self):
        try:
            # Run https-scanner
            return https.run([self.domain]).get(self.domain)
        except Exception as e:
            logging.error(f"An error occurred while scanning domain: {e}")
            return {}
