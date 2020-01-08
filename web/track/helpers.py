import pkg_resources
import yaml
import datetime
import os
from track import models
from track.data import FIELD_MAPPING
from babel.dates import format_date

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

    def lastmodified(date_format="%Y-%m-%d"):
        file_path = os.path.abspath(__file__)
        file_datetime = os.path.getmtime(file_path)
        date_readable = datetime.datetime.fromtimestamp(file_datetime).strftime(date_format)
        return date_readable

    # Make site metadata available everywhere.
    resource_package = __name__
    resource_path = 'track_meta.yml'
    meta_content = pkg_resources.resource_string(resource_package, resource_path).decode('utf-8')
    meta = yaml.safe_load(meta_content)

    @app.context_processor
    def inject_meta():
        return dict(site=meta, now=datetime.datetime.utcnow, scan_date=scan_date(), lastmodified=lastmodified())

    @app.template_filter("date")
    def datetimeformat(value, format="%H:%M / %d-%m-%Y"):
        return value.strftime(format)

    @app.template_filter("display_date")
    def displaydateformat(value, lang):
        return format_date(value, format='long', locale=lang)

    @app.template_filter("site_title")
    def displaysitetitle(value, mobile):
        if value == 'index':
            return "hidden"
        elif not mobile:
            return "flex-1"
        else:
            return ""

    @app.template_filter("field_map")
    def field_map(value, category=None, field=None):
        return FIELD_MAPPING[category][field][value]

    @app.template_filter("percent")
    def percent(num, denom):
        return round((num / denom) * 100)

    @app.template_filter("percent_not")
    def percent_not(num, denom):
        return (100 - round((num / denom) * 100))

    @app.template_filter("fetch_env")
    def fetch_env(value):
        return os.getenv(value)




