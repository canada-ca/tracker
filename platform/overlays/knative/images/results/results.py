import os
import sys
import re
import subprocess
import json
import logging
from flask import Flask, request
from datetime import datetime
from cipher_conversion import TLS_OPENSSL_TO_RFC_NAMES_MAPPING, SSLV2_OPENSSL_TO_RFC_NAMES_MAPPING

logging.basicConfig(stream=sys.stdout, level=logging.INFO)

app = Flask(__name__)

MIN_HSTS_AGE = 31536000 # one year


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

    try:

        if scan_type is "dmarc":
            report = {'dmarc': results['dmarc']}

        elif scan_type is "dkim":
            report = {'dkim': results}

        elif scan_type is "https":
            report = {"https": {}}
            # Assumes that HTTPS would be technically present, with or without issues
            if boolean_for(results["Downgrades HTTPS"]):
                https = "Downgrades HTTPS"  # No
            else:
                if boolean_for(results["Valid HTTPS"]):
                    https = "Valid HTTPS"  # Yes
                elif (
                    boolean_for(results["HTTPS Bad Chain"])
                    and not boolean_for(results["HTTPS Bad Hostname"])
                ):
                    https = "Bad Chain"  # Yes
                else:
                    https = "Bad Hostname"  # No

            report["https"]["implementation"] = https

            # Is HTTPS enforced?

            if https is "Downgrades HTTPS" or "Bad Hostname":
                behavior = "Not Enforced"  # N/A

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
                    behavior = "Strict"  # Yes (Strict)

                # "Yes" means HTTP eventually redirects to HTTPS.
                elif (
                    not boolean_for(results["Strictly Forces HTTPS"])
                    and boolean_for(results["Defaults to HTTPS"])
                ):
                    behavior = "Moderate"  # Yes

                # Either both are False, or just 'Strict Force' is True,
                # which doesn't matter on its own.
                # A "present" is better than a downgrade.
                else:
                    behavior = "Weak"  # Present (considered 'No')

            report["https"]["enforced"] = behavior

            ###
            # Characterize the presence and completeness of HSTS.

            if results["HSTS Max Age"]:
                hsts_age = int(results["HSTS Max Age"])
            else:
                hsts_age = None

            # Otherwise, without HTTPS there can be no HSTS for the domain directly.
            if https is "Downgrades HTTPS" or "Bad Hostname":
                hsts = "No HSTS"  # N/A (considered 'No')

            else:

                # HSTS is present for the canonical endpoint.
                if boolean_for(results["HSTS"]) and hsts_age:

                    # Say No for too-short max-age's, and note in the extended details.
                    if hsts_age >= MIN_HSTS_AGE:
                        hsts = "HSTS Implemented"  # Yes, directly
                    else:
                        hsts = "HSTS Max Age Too Short"  # No
                else:
                    hsts = "No HSTS"  # No

            # Separate preload status from HSTS status:
            #
            # * Domains can be preloaded through manual overrides.
            # * Confusing to mix an endpoint-level decision with a domain-level decision.
            if boolean_for(results["HSTS Preloaded"]):
                preloaded = "HSTS Preloaded"  # Yes
            elif boolean_for(results["HSTS Preload Ready"]):
                preloaded = "HSTS Preload Ready"  # Ready for submission
            else:
                preloaded = "HSTS Not Preloaded"  # No

            report["https"]["hsts"] = hsts
            report["https"]["hsts_age"] = hsts_age
            report["https"]["preloaded"] = preloaded

        elif scan_type is "ssl":
            report = {"ssl": {}}

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
                tlsv12 = boolean_for(results["TLSv1.2"])
                tlsv13 = boolean_for(results["TLSv1.3"])

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
            report["tlsv12"] = tlsv12
            report["tlsv13"] = tlsv13

    except Exception as e:
        return str(e), False

    return "Finished", True


def boolean_for(string):
    if string == "false":
        return False
    elif string == "true":
        return True
    return None


if __name__ == "__main__":
    # Port number defaults to 8080, can be configured within corresponding deployment.yaml
    app.run(debug=True,host='0.0.0.0',port=int(os.environ.get('PORT', 8080)))
