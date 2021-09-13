import os
import sys
import logging
from scan import https

logging.basicConfig(stream=sys.stdout, level=logging.INFO)

TIMEOUT = int(os.getenv("SCAN_TIMEOUT"))


class HTTPSScanner:
    domain = None

    def __init__(self, target_domain):
        self.domain = target_domain

    def run(self):
        try:
            # Run https-scanner
            results = https.run([self.domain])
            print({"full results": results})
            return results.get(self.domain)
        except Exception as e:
            logging.error(f"An error occurred while scanning domain: {e}")
            return {}
