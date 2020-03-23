FROM python:3.7-slim

# Copy local code to the container image.
ENV SCANNER_HOME /ssl
WORKDIR $SCANNER_HOME
COPY . ./

RUN pip3 install Flask gunicorn

RUN pip3 install checkdmarc
RUN pip3 install requests
RUN pip3 install PyJWT
RUN pip3 install tldextract

# Run the web service on container startup. Here we use the gunicorn
# webserver, with one worker process and 8 threads.
# For environments with multiple CPU cores, increase the number of workers
# to be equal to the cores available.
CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 dmarc_scanner:app
