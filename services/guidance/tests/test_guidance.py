import pytest
import datetime
from arango import ArangoClient
from guidance import *
from test_data import *

arango_client = ArangoClient(hosts="http://testdb:8529")
# Connect to arango system DB and create test DB
sys_db = arango_client.db("_system", username="", password="")
sys_db.create_database("test")

# Establish DB connection
db = arango_client.db("test", username="", password="")
graph = db.create_graph("compliance")


def test_update_guidance():
    test_guidance = []
    test_guidance.append(
        {"file": "scanSummaryCriteria.json", "guidance": scan_summary_criteria_data}
    )
    test_guidance.append(
        {"file": "chartSummaryCriteria.json", "guidance": chart_summary_criteria_data}
    )
    test_guidance.append({"file": "tags_dkim.json", "guidance": dkim_tag_data})
    test_guidance.append({"file": "tags_dmarc.json", "guidance": dmarc_tag_data})
    test_guidance.append({"file": "tags_spf.json", "guidance": spf_tag_data})
    test_guidance.append({"file": "tags_https.json", "guidance": https_tag_data})
    test_guidance.append({"file": "tags_ssl.json", "guidance": ssl_tag_data})
    test_guidance.append(
        {"file": "tags_aggregate.json", "guidance": aggregate_tag_data}
    )
    update_guidance(
        test_guidance, host="testdb", name="test", user="", password="", port=8529
    )
    for key, data in scan_summary_criteria_data.items():
        test_criteria = {"_key": key}
        for k, v in data.items():
            test_criteria[k] = v
        current_criteria = db.collection("scanSummaryCriteria").get({"_key": key})
        assert test_criteria == {
            "_key": current_criteria["_key"],
            "pass": current_criteria["pass"],
            "fail": current_criteria["fail"],
            "info": current_criteria["info"],
            "warning": current_criteria["warning"],
        }

    for key, data in chart_summary_criteria_data.items():
        test_criteria = {"_key": key}
        for k, v in data.items():
            test_criteria[k] = v
        current_criteria = db.collection("chartSummaryCriteria").get({"_key": key})
        assert test_criteria == {
            "_key": current_criteria["_key"],
            "pass": current_criteria["pass"],
            "fail": current_criteria["fail"],
        }

    for key, data in dkim_tag_data.items():
        test_tag = {"_key": key}
        for k, v in data.items():
            test_tag[k] = v
        current_tag = db.collection("dkimGuidanceTags").get({"_key": key})
        assert test_tag == {
            "_key": current_tag["_key"],
            "en": current_tag["en"],
            "fr": current_tag["fr"],
        }

    for key, data in dmarc_tag_data.items():
        test_tag = {"_key": key}
        for k, v in data.items():
            test_tag[k] = v
        current_tag = db.collection("dmarcGuidanceTags").get({"_key": key})
        assert test_tag == {
            "_key": current_tag["_key"],
            "en": current_tag["en"],
            "fr": current_tag["fr"],
        }

    for key, data in spf_tag_data.items():
        test_tag = {"_key": key}
        for k, v in data.items():
            test_tag[k] = v
        current_tag = db.collection("spfGuidanceTags").get({"_key": key})
        assert test_tag == {
            "_key": current_tag["_key"],
            "en": current_tag["en"],
            "fr": current_tag["fr"],
        }

    for key, data in https_tag_data.items():
        test_tag = {"_key": key}
        for k, v in data.items():
            test_tag[k] = v
        current_tag = db.collection("httpsGuidanceTags").get({"_key": key})
        assert test_tag == {
            "_key": current_tag["_key"],
            "en": current_tag["en"],
            "fr": current_tag["fr"],
        }

    for key, data in ssl_tag_data.items():
        test_tag = {"_key": key}
        for k, v in data.items():
            test_tag[k] = v
        current_tag = db.collection("sslGuidanceTags").get({"_key": key})
        assert test_tag == {
            "_key": current_tag["_key"],
            "en": current_tag["en"],
            "fr": current_tag["fr"],
        }

    for key, data in aggregate_tag_data.items():
        test_tag = {"_key": key}
        for k, v in data.items():
            test_tag[k] = v
        current_tag = db.collection("aggregateGuidanceTags").get({"_key": key})
        assert test_tag == {
            "_key": current_tag["_key"],
            "en": current_tag["en"],
            "fr": current_tag["fr"],
        }
