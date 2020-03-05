import os
import sys
import re
import subprocess
import json
import logging
from flask import Flask, request
from datetime import datetime

logging.basicConfig(stream=sys.stdout, level=logging.INFO)

app = Flask(__name__)

@app.route('/receive', methods=['GET', 'POST'])
def receive():

    try:
        result_dict = request.json["results"]
        scan_type = request.json["scan_type"]

        res = process_results(result_dict, scan_type)

        # Succeeded
        if res[1] is True:
            logging.info('Succeeded\n')
        # Failed
        else:
            raise Exception(res[0])

    except Exception as e:
        logging.error('Failed: %s\n' % str(e))

def process_results(results, scan_type):
    """
    try:
        if scan_type is "https":
            report = {}
            # assumes that HTTPS would be technically present, with or without issues
            if boolean_for(results["Downgrades HTTPS"]):
                https = 0  # No
            else:
                if boolean_for(results["Valid HTTPS"]):
                    https = 2  # Yes
                elif (
                    boolean_for(results["HTTPS Bad Chain"])
                    and not boolean_for(results["HTTPS Bad Hostname"])
                ):
                    https = 1  # Yes
                else:
                    https = -1  # No

            report["uses"] = https

            ###
            # Is HTTPS enforced?

            if https <= 0:
                behavior = 0  # N/A

            else:

                # "Yes (Strict)" means HTTP immediately redirects to HTTPS,
                # *and* that HTTP eventually redirects to HTTPS.
                #
                # Since a pure redirector domain can't "default" to HTTPS
                # for itself, we'll say it "Enforces HTTPS" if it immediately
                # redirects to an HTTPS URL.
                if (
                    boolean_for(results["Strictly Forces HTTPS"])
                    and (
                    boolean_for(results["Defaults to HTTPS"]) or boolean_for(results["Redirect"])
                )
                ):
                    behavior = 3  # Yes (Strict)

                # "Yes" means HTTP eventually redirects to HTTPS.
                elif (
                    not boolean_for(results["Strictly Forces HTTPS"])
                    and boolean_for(results["Defaults to HTTPS"])
                ):
                    behavior = 2  # Yes

                # Either both are False, or just 'Strict Force' is True,
                # which doesn't matter on its own.
                # A "present" is better than a downgrade.
                else:
                    behavior = 1  # Present (considered 'No')

            report["enforces"] = behavior

            ###
            # Characterize the presence and completeness of HSTS.

            if results["HSTS Max Age"]:
                hsts_age = int(results["HSTS Max Age"])
            else:
                hsts_age = None

            # If this is a subdomain, it can be considered as having HSTS, via
            # the preloading of its parent.
            if parent_preloaded:
                hsts = 3  # Yes, via preloading

            # Otherwise, without HTTPS there can be no HSTS for the domain directly.
            elif https <= 0:
                hsts = -1  # N/A (considered 'No')

            else:

                # HSTS is present for the canonical endpoint.
                if boolean_for(results["HSTS"]) and hsts_age:

                    # Say No for too-short max-age's, and note in the extended details.
                    if hsts_age >= MIN_HSTS_AGE:
                        hsts = 2  # Yes, directly
                    else:
                        hsts = 1  # No
                else:
                    hsts = 0  # No

            # Separate preload status from HSTS status:
            #
            # * Domains can be preloaded through manual overrides.
            # * Confusing to mix an endpoint-level decision with a domain-level decision.
            if boolean_for(results["HSTS Preloaded"]):
                preloaded = 2  # Yes
            elif boolean_for(results["HSTS Preload Ready"]):
                preloaded = 1  # Ready for submission
            else:
                preloaded = 0  # No

            report["hsts"] = hsts
            report["hsts_age"] = hsts_age
            results["preloaded"] = preloaded

        elif scan_type is "ssl":
                report = {}

                # Get cipher/protocol data via sslyze for a host.

                sslv2 = None
                sslv3 = None
                any_rc4 = None
                any_3des = None
                bad_ciphers = []
                acceptable_ciphers = None
                signature_algorithm = None
                good_cert = -1
                tlsv10 = None
                tlsv11 = None

                # values: unknown or N/A (-1), No (0), Yes (1)
                bod_crypto = None

                if sslyze is None:
                    bod_crypto = -1  # Unknown

                else:
                    ###
                    # BOD 18-01 (cyber.dhs.gov) cares about SSLv2, SSLv3, RC4, and 3DES.
                    any_rc4 = boolean_for(results["Any RC4"])

                    if results.get("Any 3DES"):
                        any_3des = boolean_for(results["Any 3DES"])
                    sslv2 = boolean_for(results["SSLv2"])
                    sslv3 = boolean_for(results["SSLv3"])

                    ###
                    # ITPIN cares about usage of TLS 1.0 and TLS 1.1
                    tlsv10 = boolean_for(results["TLSv1.0"])
                    tlsv11 = boolean_for(results["TLSv1.1"])

                    used_ciphers = {cipher for cipher in results.accepted_cipher_list}
                    bad_ciphers = list(used_ciphers - results.accepted_cipher_list)
                    signature_algorithm = results.get("Signature Algorithm", "sha1")
                    acceptable_ciphers = not bad_ciphers

                    match = re.match(r"sha(?:3-)?(\d+)(?:-\d+)?$", signature_algorithm)
                    if match:
                        good_cert = int(int(match.group(1)) >= 256)
                    else:
                        logging.error("Could not decipher %s algorithm", signature_algorithm)

                    if any([any_rc4, any_3des, sslv2, sslv3, tlsv10, tlsv11, not acceptable_ciphers]):
                        bod_crypto = 0
                    else:
                        bod_crypto = 1

                report["bod_crypto"] = bod_crypto
                report["rc4"] = any_rc4
                report["3des"] = any_3des
                report["sslv2"] = sslv2
                report["sslv3"] = sslv3
                report["accepted_ciphers"] = acceptable_ciphers
                report["bad_ciphers"] = bad_ciphers
                report["good_cert"] = good_cert
                report["signature_algorithm"] = signature_algorithm
                report["tlsv10"] = tlsv10
                report["tlsv11"] = tlsv11

        return "Finished", True

    except Exception as e:
        return str(e), False
    """
    try:

        if scan_type is "dmarc":
            report = {'dmarc': results['dmarc']}

    except Exception as e:
        return str(e), False

    return "Finished", True


def boolean_for(string):
    if string == "False":
        return False
    elif string == "True":
        return True
    return None


if __name__ == "__main__":
    # Port number defaults to 8080, can be configured within corresponding deployment.yaml
    app.run(debug=True,host='0.0.0.0',port=int(os.environ.get('PORT', 8080)))
