from pebble import concurrent

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
