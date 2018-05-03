#!/usr/bin/env python
import os
import newrelic.agent
from cfenv import AppEnv
from waitress import serve
from pulse import create_app

if __name__ == "__main__":
  port = int(os.getenv("PORT", 5000))
  environment = os.getenv("PULSE_ENV", "development")
  app = create_app(environment)

  # Configure newrelic
  env = AppEnv()
  app_name = os.environ.get('NEW_RELIC_APP_NAME')
  license_key = env.get_credential('NEW_RELIC_LICENSE_KEY')

  if app_name and license_key:
    nr_settings = newrelic.agent.global_settings()
    nr_settings.app_name = app_name
    nr_settings.license_key = license_key
    newrelic.agent.initialize()

  if environment == "development":
    app.debug = True
    app.run(port=port)
  else:
    serve(app, port=port)
