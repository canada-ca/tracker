import os
import pkg_resources
import yaml
import datetime
from pulse import models
from pulse.data import FIELD_MAPPING

# For use in templates.
def register(app):

    ###
    # Context processors and filters.

    def scan_date():
        latest = models.Report.latest()
        if latest:
            return models.Report.report_time(latest["report_date"])
        else:
            return datetime.datetime.now()

    # Make site metadata available everywhere.
    resource_package = __name__
    resource_path = 'pulse_meta.yml'
    meta_content = pkg_resources.resource_stream(resource_package, resource_path)
    meta = yaml.safe_load(meta_content)

    @app.context_processor
    def inject_meta():
        return dict(site=meta, now=datetime.datetime.utcnow, scan_date=scan_date())

    @app.template_filter("date")
    def datetimeformat(value, format="%H:%M / %d-%m-%Y"):
        return value.strftime(format)

    @app.template_filter("field_map")
    def field_map(value, category=None, field=None):
        return FIELD_MAPPING[category][field][value]

    @app.template_filter("percent")
    def percent(num, denom):
        return round((num / denom) * 100)

    @app.template_filter("percent_not")
    def percent_not(num, denom):
        return (100 - round((num / denom) * 100))
