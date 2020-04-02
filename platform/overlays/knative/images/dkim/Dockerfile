FROM python:3.7-slim

# Copy local code to the container image.
ENV SCANNER_HOME /dkim
WORKDIR $SCANNER_HOME
COPY . ./

RUN pip3 install Flask gunicorn

RUN pip3 install dkimpy
RUN pip3 install requests
RUN pip3 install dnspython
RUN pip3 install PyJWT

# Run the web service on container startup. Using waitress, in this case.
CMD exec waitress-serve dkim_scanner:app
