
from flask import render_template, Response
from pulse import models
from pulse.data import FIELD_MAPPING
import os
import ujson

def register(app):

    @app.route("/")
    def index():
        return render_template("index.html")

    @app.route("/domains/")
    def https_domains():
        return render_template("domains.html")

    @app.route("/about/")
    def about():
        return render_template("about.html")

    @app.route("/feedback/")
    def feedback():
        return render_template("feedback.html")

    ##
    # Data endpoints.

    # High-level %'s, used to power the donuts.
    @app.route("/data/reports/<report_name>.json")
    def report(report_name):
        response = Response(ujson.dumps(models.Report.latest().get(report_name, {})))
        response.headers['Content-Type'] = 'application/json'
        return response

    # Detailed data per-parent-domain.
    @app.route("/data/domains/<report_name>.<ext>")
    def domain_report(report_name, ext):
        domains = models.Domain.eligible_parents(report_name)
        domains = sorted(domains, key=lambda k: k['domain'])

        if ext == "json":
          response = Response(ujson.dumps({'data': domains}))
          response.headers['Content-Type'] = 'application/json'
        elif ext == "csv":
          response = Response(models.Domain.to_csv(domains, report_name))
          response.headers['Content-Type'] = 'text/csv'
        return response

    # Detailed data per-host for a given report.
    @app.route("/data/hosts/<report_name>.<ext>")
    def hostname_report(report_name, ext):
        domains = models.Domain.eligible(report_name)

        # sort by base domain, but subdomain within them
        domains = sorted(domains, key=lambda k: k['domain'])
        domains = sorted(domains, key=lambda k: k['base_domain'])

        if ext == "json":
          response = Response(ujson.dumps({'data': domains}))
          response.headers['Content-Type'] = 'application/json'
        elif ext == "csv":
          response = Response(models.Domain.to_csv(domains, report_name))
          response.headers['Content-Type'] = 'text/csv'
        return response

    # Detailed data for all subdomains of a given parent domain, for a given report.
    @app.route("/data/hosts/<domain>/<report_name>.<ext>")
    def hostname_report_for_domain(domain, report_name, ext):
        domains = models.Domain.eligible_for_domain(domain, report_name)

        # sort by hostname, but put the parent at the top if it exist
        domains = sorted(domains, key=lambda k: k['domain'])
        domains = sorted(domains, key=lambda k: k['is_parent'], reverse=True)

        if ext == "json":
            response = Response(ujson.dumps({'data': domains}))
            response.headers['Content-Type'] = 'application/json'
        elif ext == "csv":
            response = Response(models.Domain.to_csv(domains, report_name))
            response.headers['Content-Type'] = 'text/csv'
        return response

    @app.route("/data/agencies/<report_name>.json")
    def agency_report(report_name):
        domains = models.Agency.eligible(report_name)
        response = Response(ujson.dumps({'data': domains}))
        response.headers['Content-Type'] = 'application/json'
        return response

    # Sanity-check RSS feed, shows the latest report.
    @app.route("/data/reports/feed/")
    def report_feed():
        return render_template("feed.xml")

    @app.errorhandler(404)
    def page_not_found(e):
      return render_template('404.html'), 404
