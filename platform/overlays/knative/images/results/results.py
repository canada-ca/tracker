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
            if results is not None:
                report = {"dmarc": results["dmarc"]}
            else:
                report = {"dmarc": {"missing": True}}

        elif scan_type is "dkim":
            if results is not None:
                report = {"dkim": results}
            else:
                report = {"dkim": {"missing": True}}

        elif scan_type is "https":
            if results is not None:
                report = {"https": {}}
            else:
                report = {"https": {"missing": True}}

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

                # "Strict" means HTTP immediately redirects to HTTPS,
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

                # "Moderate" means HTTP eventually redirects to HTTPS.
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
                        hsts = "HSTS Fully Implemented"  # Yes, directly
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

            # Certificate info
            if boolean_for(results["HTTPS Expired Cert"]):
                expired = True
            else:
                expired = False

            if boolean_for(results["HTTPS Self-Signed Cert"]):
                self_signed = True
            else:
                self_signed = False

            report["https"]["hsts"] = hsts
            report["https"]["hsts_age"] = hsts_age
            report["https"]["preload_status"] = preloaded
            report["https"]["expired_cert"] = expired
            report["https"]["self_signed_cert"] = self_signed

        elif scan_type is "ssl":
            if results is not None:
                report = {"ssl": {}}
            else:
                report = {"ssl": {"missing": True}}

            # Get cipher/protocol data via sslyze for a host.

            if results is None:
                report["ssl"]["sslv2"] = False
                report["ssl"]["sslv3"] = False
                report["ssl"]["tlsv1_0"] = False
                report["ssl"]["tlsv1_1"] = False
                report["ssl"]["tlsv1_2"] = False
                report["ssl"]["tlsv1_3"] = False
                report["ssl"]["bod_crypto"] = False
                report["ssl"]["rc4"] = False
                report["ssl"]["3des"] = False
                report["ssl"]["used_ciphers"] = []
                report["ssl"]["good_cert"] = False
                report["ssl"]["signature_algorithm"] = None
                report["ssl"]["starttls"] = False
                report["ssl"]["heartbleed"] = False
                report["ssl"]["openssl_ccs_injection"] = False
                return results


            ###
            # BOD 18-01 (cyber.dhs.gov) cares about SSLv2, SSLv3, RC4, and 3DES.
            any_rc4 = results["rc4"]

            any_3des = results["3des"]

            ###
            # ITPIN cares about usage of TLS 1.0/1.1/1.2
            highest_ssl_version_supported = None

            for version in ["SSLV2", "SSLV3", "TLSV1", "TLSV1_1", "TLSV1_2", "TLSV1_3"]:
                if version in results.keys():
                    report["ssl"][version] = True
                    highest_ssl_version_supported = version
                else:
                    report["ssl"][version] = False

            used_ciphers = {cipher for cipher in results[highest_ssl_version_supported].accepted_cipher_list}
            signature_algorithm = results["signature_algorithm"]

            if any([any_rc4, any_3des, report["ssl"]["SSLV2"], report["ssl"]["SSLV3"], report["ssl"]["TLSV1"], report["ssl"]["TLSV1_1"]]):
                bod_crypto = False
            else:
                bod_crypto = True

            starttls = results["starttls"]

            heartbleed = results["is_vulnerable_to_heartbleed"]
            ccs_injection = results["is_vulnerable_to_ccs_injection"]

            if results["signature_algorithm"] is "SHA256" or "SHA384" or "AEAD":
                good_cert = True
            else:
                good_cert = False

            report["ssl"]["bod_crypto"] = bod_crypto
            report["ssl"]["rc4"] = any_rc4
            report["ssl"]["3des"] = any_3des
            report["ssl"]["used_ciphers"] = used_ciphers
            report["ssl"]["acceptable_certificate"] = good_cert
            report["ssl"]["signature_algorithm"] = signature_algorithm
            report["ssl"]["starttls"] = starttls

            report["ssl"]["heartbleed"] = heartbleed
            report["ssl"]["openssl_ccs_injection"] = ccs_injection

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
