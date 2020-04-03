FROM ubuntu:20.04

# Copy local code to the container image.
ENV SCANNER_HOME /dmarc
WORKDIR $SCANNER_HOME
COPY . ./

RUN apt-get install python3-pip
RUN pip3 install Flask gunicorn

RUN pip3 install checkdmarc
RUN pip3 install requests
RUN pip3 install PyJWT
RUN pip3 install tldextract

# Run the web service on container startup. Using waitress, in this case.
CMD exec waitress-serve dmarc_scanner:app
