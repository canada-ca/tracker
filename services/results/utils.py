import os
import sys
import json
import logging
import traceback
from gql import gql, Client
from gql.transport.requests import RequestsHTTPTransport

REPO_NAME = os.getenv("REPO_NAME")
REPO_OWNER = os.getenv("REPO_OWNER")
GUIDANCE_DIR = os.getenv("GUIDANCE_DIR")
GUIDANCE_FILE = "tls-guidance.json"
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")

logging.basicConfig(stream=sys.stdout, level=logging.INFO)


def retrieve_tls_guidance():
    logging.info("Retrieving TLS guidance...")

    if not all(
        i is not None for i in [REPO_NAME, REPO_OWNER, GUIDANCE_DIR, GITHUB_TOKEN]
    ):
        logging.error(
            "Missing one or more secrets required for TLS guidance retrieval. SSL results may not reflect compliance."
        )
        return {
            "ciphers": {
                "1.2": {"recommended": [], "sufficient": [], "phase_out": []},
                "1.3": {"recommended": [], "sufficient": []},
            },
            "curves": {"recommended": [], "sufficient": [], "phase_out": []},
            "signature_algorithms": {
                "recommended": [],
                "sufficient": [],
                "phase_out": [],
            },
            "extensions": {"1.2": {"recommended": []}, "1.3": {"recommended": []}},
        }

    try:
        gh_client = Client(
            transport=RequestsHTTPTransport(
                url="https://api.github.com/graphql",
                headers={"Authorization": "bearer " + GITHUB_TOKEN},
            ),
        )

        # fmt: off
        guidance_query = """
        {{
          repository(name: "{REPO_NAME}", owner: "{REPO_OWNER}") {{
            id
            object(expression: "main:{GUIDANCE_DIR}/{GUIDANCE_FILE}") {{
              ... on Blob {{
                text
              }}
            }}
          }}
        }}
        """.format(**{"REPO_NAME": REPO_NAME, "REPO_OWNER": REPO_OWNER, "GUIDANCE_DIR": GUIDANCE_DIR, "GUIDANCE_FILE": GUIDANCE_FILE})
        # fmt: on
        guidance_result = gh_client.execute(gql(guidance_query))
        guidance = json.loads(guidance_result["repository"]["object"]["text"])

        logging.info(f"TLS guidance retrieved.")
        return guidance
    except Exception as e:
        logging.error(
            f"Error occurred while retrieving TLS guidance. SSL results may not reflect compliance. {str(e)} \n\nFull traceback: {traceback.format_exc()}"
        )
        return {
            "ciphers": {
                "1.2": {"recommended": [], "sufficient": [], "phase_out": []},
                "1.3": {"recommended": [], "sufficient": []},
            },
            "curves": {"recommended": [], "sufficient": [], "phase_out": []},
            "signature_algorithms": {
                "recommended": [],
                "sufficient": [],
                "phase_out": [],
            },
            "extensions": {"1.2": {"recommended": []}, "1.3": {"recommended": []}},
        }


def formatted_dictionary(data):
    data_str = json.dumps(data)
    formatted = (
        data.replace("false", "False")
        .replace("true", "True")
        .replace("null", "None")
        .replace("none", "None")
    )
    formatted_dict = json.loads(formatted)
    return formatted_dict
