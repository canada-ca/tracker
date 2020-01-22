import json
import os

from datetime import datetime
from http import HTTPStatus

from .config import *
from .input_validators import *
from .user_model import *

from flask import render_template, Response, abort, request, redirect, url_for

from flask_login import LoginManager, login_required, login_user, logout_user, current_user
from flask_bcrypt import Bcrypt
from track import models
from flask_bcrypt import Bcrypt
from track import models, error_messages
from track.cache import cache

from notifications_python_client.notifications import NotificationsAPIClient
from track import api_config

from itsdangerous import URLSafeTimedSerializer

#
# notifications_client = NotificationsAPIClient(
#     api_config.api_key,
#     api_config.api_url,
# )


def register(app):
    # Initialize flask-login

    app.secret_key = api_config.super_secret_key

    login_manager = LoginManager()
    login_manager.session_protection = "strong"
    login_manager.init_app(app)

    @login_manager.user_loader
    def load_user(user_id):
        return connection.query_user_by_id(user_id)

    # Initialize flask-Bcrypt
    bcrypt = Bcrypt(app)

    # Default route checks accept-language header
    # Redirects based on browser language, defaults to english
    @app.route("/")
    def index():
        user_lang = request.headers.get("Accept-Language", "en")
        if user_lang[:2] == "fr":
            return redirect("/fr/index/")
        else:
            return redirect("/en/index/")

    @app.route("/ping")
    def health_check():
        return "PONG"

    @app.route("/en/")
    @app.route("/fr/")
    @app.route("/en/index/")
    @app.route("/fr/index/")
    def splash_page():
        prefix = request.path[1:3]
        return render_template(generate_path(prefix, "index"))

    @app.route("/en/organizations/")
    @app.route("/fr/organisations/")
    def organizations():
        prefix = request.path[1:3]
        return render_template(generate_path(prefix, "organizations"))

    @app.route("/en/domains/")
    @app.route("/fr/domaines/")
    def https_domains():
        prefix = request.path[1:3]
        return render_template(generate_path(prefix, "domains"))

    @app.route("/en/guidance/")
    @app.route("/fr/directives/")
    def guidance():
        prefix = request.path[1:3]
        return render_template(generate_path(prefix, "guidance"))

    @app.route("/en/help/")
    @app.route("/fr/aide/")
    def help():
        prefix = request.path[1:3]
        return render_template(generate_path(prefix, "help"))

    def generate_path(prefix, page_id):
        if prefix == "en" or prefix == "fr":
            return os.path.join(prefix, "{}.html".format(page_id))
        else:
            abort(HTTPStatus.NOT_FOUND)

    @app.route("/cache-buster")
    def cache_bust():
        try:
            cache.clear()
            return "", HTTPStatus.NO_CONTENT
        except Exception as exc:
            return str(exc), HTTPStatus.INTERNAL_SERVER_ERROR

    ##
    # Data endpoints.

    # High-level %'s, used to power the donuts.
    @app.route("/data/reports/<report_name>.json")
    @cache.cached()
    def report(report_name):
        report_name = "https" if report_name == "compliance" else report_name

        response = Response(json.dumps(models.Report.latest().get(report_name, {})))
        response.headers["Content-Type"] = "application/json"
        return response

    # Detailed data per-parent-domain.
    @app.route("/data/domains/<report_name>.json")
    @cache.cached()
    def domain_report(report_name):
        report_name = "https" if report_name == "compliance" else report_name

        domains = models.Domain.eligible_parents(report_name)
        domains = sorted(domains, key=lambda k: k["domain"])

        response = Response(json.dumps({"data": domains}))
        response.headers["Content-Type"] = "application/json"
        return response

    @app.route("/data/domains/<language>/<report_name>.csv")
    @cache.cached()
    def domain_report_csv(report_name, language):
        report_name = "https" if report_name == "compliance" else report_name

        domains = models.Domain.eligible_parents(report_name)
        domains = sorted(domains, key=lambda k: k["domain"])

        response = Response(models.Domain.to_csv(domains, report_name, language))
        response.headers["Content-Type"] = "text/csv"
        return response

    @app.route("/data/domains-table.json")
    @cache.cached()
    def domains_table():
        domains = models.Domain.find_all(
            {"https.eligible_zone": True, "is_parent": True},
            {
                "_id": False,
                "domain": True,
                "organization_name_en": True,
                "organization_name_fr": True,
                "is_parent": True,
                "base_domain": True,
                "https.eligible": True,
                "https.enforces": True,
                "https.hsts": True,
                "https.compliant": True,
                "https.bod_crypto": True,
                "https.good_cert": True,
                "totals.https.enforces": True,
                "totals.https.hsts": True,
                "totals.https.compliant": True,
                "totals.https.eligible": True,
                "totals.crypto.bod_crypto": True,
                "totals.crypto.good_cert": True,
                "totals.crypto.eligible": True,
            },
        )
        response = Response(json.dumps({"data": list(domains)}))
        response.headers["Content-Type"] = "application/json"
        return response

    @app.route("/data/organizations-table.json")
    @cache.cached()
    def organizations_table():
        organizations = models.Organization.find_all(
            {"https.eligible": {"$gt": 0}},
            {
                "_id": False,
                "total_domains": True,
                "name_en": True,
                "name_fr": True,
                "https.compliant": True,
                "https.enforces": True,
                "https.hsts": True,
                "https.eligible": True,
                "crypto.bod_crypto": True,
                "crypto.good_cert": True,
                "crypto.eligible": True,
            },
        )
        # app.logger.debug([o for o in organizations])
        response = Response(json.dumps({"data": list(organizations)}))
        response.headers["Content-Type"] = "application/json"
        return response

    # Detailed data per-host for a given report.
    @app.route("/data/hosts/<report_name>.json")
    @cache.cached()
    def hostname_report(report_name):
        report_name = "https" if report_name == "compliance" else report_name

        domains = models.Domain.eligible(report_name)

        # sort by base domain, but subdomain within them
        domains = sorted(domains, key=lambda k: k["domain"])
        domains = sorted(domains, key=lambda k: k["base_domain"])

        response = Response(json.dumps({"data": domains}))
        response.headers["Content-Type"] = "application/json"
        return response

    @app.route("/data/hosts/<language>/<report_name>.csv")
    @cache.cached()
    def hostname_report_csv(language, report_name):
        report_name = "https" if report_name == "compliance" else report_name

        domains = models.Domain.eligible(report_name)

        # sort by base domain, but subdomain within them
        domains = sorted(domains, key=lambda k: k["domain"])
        domains = sorted(domains, key=lambda k: k["base_domain"])

        response = Response(models.Domain.to_csv(domains, report_name, language))
        response.headers["Content-Type"] = "text/csv"
        return response

    # Detailed data for all subdomains of a given parent domain, for a given report.
    @app.route("/data/hosts/<domain>/<report_name>.json")
    @cache.cached()
    def hostname_report_for_domain(domain, report_name):
        report_name = "https" if report_name == "compliance" else report_name

        domains = models.Domain.eligible_for_domain(domain, report_name)

        # sort by hostname, but put the parent at the top if it exist
        domains = sorted(domains, key=lambda k: k["domain"])
        domains = sorted(domains, key=lambda k: k["is_parent"], reverse=True)

        response = Response(json.dumps({"data": domains}))
        response.headers["Content-Type"] = "application/json"
        return response

    # Detailed data for all subdomains of a given parent domain, for a given report.
    @app.route("/data/hosts/<domain>/<language>/<report_name>.csv")
    @cache.cached()
    def hostname_report_for_domain_csv(domain, language, report_name):
        report_name = "https" if report_name == "compliance" else report_name

        domains = models.Domain.eligible_for_domain(domain, report_name)

        # sort by hostname, but put the parent at the top if it exist
        domains = sorted(domains, key=lambda k: k["domain"])
        domains = sorted(domains, key=lambda k: k["is_parent"], reverse=True)

        response = Response(models.Domain.to_csv(domains, report_name, language))
        response.headers["Content-Type"] = "text/csv"
        return response

    @app.route("/data/organizations/<report_name>.json")
    @cache.cached()
    def organization_report(report_name):
        report_name = "https" if report_name == "compliance" else report_name

        domains = models.Organization.eligible(report_name)
        response = Response(json.dumps({"data": list(domains)}))
        response.headers["Content-Type"] = "application/json"
        return response

    ##
    # Auth endpoints.
    #

    # Connection to Postgres database -- TODO: Move to more appropriate (Top level?) location.
    connection = Connection(_user=api_config.db_user, _password=api_config.db_pass, _host=api_config.db_host,
                            _port=api_config.db_port, _db=api_config.db_name)

    @app.route("/en/sign-in", endpoint='en_sign_in', methods=['GET', 'POST'])
    @app.route("/fr/sign-in", endpoint='fr_sign_in', methods=['GET', 'POST'])
    def sign_in_page():
        prefix = request.path[1:3]
        if request.method == 'GET':
            if current_user.is_authenticated:
                # If a user is already logged in, redirect to user-profile
                return redirect('user-profile')
            else:
                return render_template(generate_path(prefix, "sign-in"))

        else:
            user_email = cleanse_input(request.form.get('email_input'))
            user_password = cleanse_input(request.form.get('password_input'))

            user = connection.query_user_by_email(user_email)

            if user is not None:  # If a user with that email address exists
                if not connection.is_user_account_locked(user_email):  # Check that account is not locked
                    if bcrypt.check_password_hash(user.user_password, user_password):
                        login_user(user)
                        # After a successful login, set failed login attempts to 0
                        connection.reset_failed_login_attempts(user_email)
                        connection.commit()
                        return render_template(generate_path(prefix, 'user-profile'), **generate_user_data(user_email))

                    else:
                        # If login fails, increment the failed attempts counter.
                        connection.increment_failed_login_attempts(user_email)
                        connection.commit()
                else:
                    # This account is locked due to too many failed login attempts
                    return 'TODO: Redirect to password reset -- User Account has too many failed attempts' \
                           ' -- Implement Nick\'s reset password feature'

            # The sign in credentials were not valid, display appropriate error to the user.
            content = error_messages.sign_in_incorrect(user_email)
            return render_template(generate_path(prefix, "sign-in"), **content)

    @app.route("/en/register", methods=['GET', 'POST'])
    @app.route("/fr/register", methods=['GET', 'POST'])
    def register_user():
        prefix = request.path[1:3]

        # User visiting register page, display page
        if request.method == 'GET':
            if current_user.is_authenticated:
                # If a user is already logged in, redirect to user-profile
                return redirect('user-profile', **generate_user_data(current_user.user_email))
            else:
                return render_template(generate_path(prefix, "register"))

        else:
            user_name = cleanse_input(request.form.get('name_input'))
            user_email = cleanse_input(request.form.get('email_input'))
            user_password = cleanse_input(request.form.get('password_input'))
            user_password_confirm = cleanse_input(request.form.get('password_confirm_input'))

            # Check if passwords match
            if user_password == user_password_confirm:
                if is_strong_password(user_password):

                    user = connection.query_user_by_email(user_email)

                    if user is not None:
                        # User already exists using this email
                        content = error_messages.email_already_taken(user_name, user_email)
                        return render_template(generate_path(prefix, "register"), **content)

                    else:
                        # Create a user to insert into the database
                        to_add = Users(
                            username=user_name,
                            display_name=user_name,
                            user_email=user_email.lower(),
                            user_password=bcrypt.generate_password_hash(user_password).decode('UTF-8'),  # Flask-Bcrypt password hash
                            preferred_lang="English",
                            failed_login_attempts=0
                        )
                        connection.insert(to_add)
                        connection.commit()

                        return render_template(generate_path(prefix, "email-sent"))

                else:
                    content = error_messages.password_weak_register(user_name, user_email)
                    return render_template(generate_path(prefix, "register"), **content)

            else:
                # If passwords do not match, redirect back to register page with appropriate error message.
                content = error_messages.password_not_match_register(user_name, user_email)
                return render_template(generate_path(prefix, "register"), **content)

    @app.route("/en/user-profile")
    @app.route("/fr/user-profile")
    @login_required
    def user_profile():
        prefix = request.path[1:3]
        return render_template(generate_path(prefix, 'user-profile'), **generate_user_data(current_user.user_email))

    @app.route("/en/logout")
    @app.route("/fr/logout")
    @login_required
    def logout():
        prefix = request.path[1:3]
        logout_user()
        return render_template(generate_path(prefix, 'logout'))

    @app.route("/en/forgot-password", methods=['GET', 'POST'])
    @app.route("/fr/forgot-password", methods=['GET', 'POST'])
    def forgot_password():
        prefix = request.path[1:3]
        if request.method == 'GET':
            return render_template(generate_path(prefix, "forgot-password"))
        else:

            user_email = cleanse_input(request.form.get('email_input'))
            user = connection.query_user_by_email(user_email)
            return send_pass_reset(user_email, user, prefix)

            # msg = 'If an account is associated with the email address, ' \
            #     'further instructions will arrive in your inbox'
            # return render_template(generate_path(prefix, "forgot-password"), msg=msg)

    @app.route("/en/new-password/<token>", endpoint='en_new_password', methods=['GET', 'POST'])
    @app.route("/fr/new-password/<token>", endpoint='fr_new_password', methods=['GET', 'POST'])
    def new_password(token):
        prefix = request.path[1:3]
        if request.method == 'GET':
            return render_template(generate_path(prefix, 'new-password'), token=token)
        else:
            # Try to see if email matches email set in token
            try:
                password_reset_serial = URLSafeTimedSerializer(api_config.super_secret_key)
                email = password_reset_serial.loads(token, salt=api_config.super_secret_salt, max_age=3600)
            except:
                content = error_messages.sign_in_change_pass()
                return redirect(url_for(prefix + '_sign_in', **content))

            user = connection.query_user_by_email(email)

            user_password = cleanse_input(request.form.get('password_input'))
            user_password_confirm = cleanse_input(request.form.get('password_confirm_input'))

            if user_password == user_password_confirm:
                if is_strong_password(user_password):
                    # Create a user to insert into the database
                    user_password = bcrypt.generate_password_hash(user_password).decode('UTF-8')  # Flask-Bcrypt password hash

                    result = connection.update_user_password(email, user_password)

                    if result:
                        return render_template(generate_path(prefix, "password-changed"))
                    else:
                        content = error_messages.password_db_error(token)
                        return render_template(generate_path(prefix, "password-changed"))
                else:
                    content = error_messages.password_weak_forgot(token)
                    return render_template(generate_path(prefix, "new-password"), **content)

            # If passwords do not match, redirect back to register page
            else:
                content = error_messages.password_no_match_forgot(token)
                return render_template(generate_path(prefix, "new-password"), **content)

    @app.route("/en/password-changed")
    @app.route("/fr/password-changed")
    def password_changed():
        prefix = request.path[1:3]
        return render_template(generate_path(prefix, 'password-changed'))

    @app.route("/en/verify-account", methods=['GET', 'POST'])
    @app.route("/fr/verify-account", methods=['GET', 'POST'])
    def verify_account():
        prefix = request.path[1:3]
        if request.method == 'GET':
            return render_template(generate_path(prefix, "verify-account"))
        else:
            phone = request.form.get('mobile_input')
            # Create Token and send text  notification
            # response = notifications_client.send_sms_notification(
            #     phone_number='+1' + phone,
            #     template_id='Some ID',
            #     personalisation={
            #         'token':token
            #     }
            # )

            # Hide Mobile Number
            # i = 0
            # hidden_phone = ''
            # for char in phone:
            #     if char == '-':
            #         hidden_phone += char
            #     else:
            #         if i < 6:
            #             hidden_phone += '*'
            #         else:
            #             hidden_phone += char
            #         i += 1
            return redirect('/' + prefix + '/verify-account/mobile')

    @app.route("/en/verify-account/mobile", methods=['GET', 'POST'])
    @app.route("/fr/verify-account/mobile", methods=['GET', 'POST'])
    def verify_account_mobile():
        prefix = request.path[1:3]
        phone = 'placeholder: ***-***-3333'
        return render_template(generate_path(prefix, "verify-mobile"), phone=phone)


    def send_pass_reset(user_email, user, prefix):
        if user is not None and user.is_authenticated:
            password_reset_serial = URLSafeTimedSerializer(api_config.super_secret_key)
            password_reset_url = url_for(prefix + '_new_password',
                                         token=password_reset_serial.dumps(user_email, salt=api_config.super_secret_salt),
                                         _external=True
                                         )
            return render_template(generate_path(prefix, "reset-email-temp"), password_reset_url=password_reset_url)
            # response = notifications_client.send_email_notification(
            #     email_address='email_address',
            #     template_id='6e3368a7-0d75-47b1-b4b2-878234e554c9'we
            # )
            # General Notification

    def generate_user_data(_email):
        user = connection.query_user_by_email(_email)
        return {
                'id': user.id,
                'username': user.username,
                'display_name': user.display_name,
                'user_email': user.user_email,
                # 'user_password': user.user_password,
                'preferred_lang': user.preferred_lang
                # 'failed_login_attempts': user.failed_login_attempts
            }
      

    # Every response back to the browser will include these web response headers
    @app.after_request
    def apply_headers(response):
        return response

    @app.errorhandler(404)
    def page_not_found(error):
        prefix = request.path[1:3]
        return render_template(generate_path(prefix, '404')), HTTPStatus.NOT_FOUND

    @app.errorhandler(401)
    def invalid_credentials(error):
        prefix = request.path[1:3]
        return render_template(generate_path(prefix, '401')), HTTPStatus.UNAUTHORIZED

    @app.errorhandler(models.QueryError)
    def handle_invalid_usage(error):
        app.logger.error(error)
        return render_template("404.html"), HTTPStatus.NOT_FOUND

    @app.before_request
    def verify_cache():
        cur_time = datetime.now()

        if cache.get('last-cache-bump') is None:
            cache.set('last-cache-bump', cur_time)

        if cache.get('cache-timer') is None:
            # Set up a 5 minute timer to minimize flailing.
            cache.set('cache-timer', cur_time, 5 * 60)

            # Let's check the remote cache flag (time value)
            remote_signal = datetime.strptime(models.Flag.get_cache(), "%Y-%m-%d %H:%M")
            app.logger.warn("TRACK_CACHE: remote signal @ {}".format(remote_signal))

            if remote_signal is not None:
                if cache.get('last-cache-bump') < remote_signal:
                    app.logger.warn("TRACK_CACHE: Cache reset @ {} due to signal @ {}".format(cur_time, remote_signal))
                    cache.clear()
                    # We've blown the whole cache, so reset the cache timer, and the remote val.
                    cache.set('cache-timer', cur_time, 5 * 60)
                    cache.set('last-cache-bump', remote_signal)
            else:
                app.logger.error("TRACK_CACHE: remote cache datetime was None. Danger Will Robinson.")


# Converts 'User' object to a JSON object
def to_json(user):
    json_user = {
        'id': user.id,
        'username': user.username,
        'display_name': user.display_name,
        'user_email': user.user_email,
        'preferred_lang': user.preferred_lang
    }
    return json_user

