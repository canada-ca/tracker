import os
from track import create_app

port = int(os.getenv("PORT", 5000))
environment = os.getenv("TRACKER_ENV", "development")
app = create_app(environment)

if __name__ == "__main__":
    if environment == "development":
        app.debug = True

    app.run(port=port)
