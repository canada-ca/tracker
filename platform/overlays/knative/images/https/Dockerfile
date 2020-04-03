FROM ubuntu:20.04

# Copy local code to the container image.
ENV SCANNER_HOME /https
WORKDIR $SCANNER_HOME
COPY . ./

RUN apt-get install python3-pip
RUN pip3 install Flask waitress

RUN pip3 install pshtt
RUN pip3 install PyJWT

# Run the web service on container startup. Using waitress, in this case.
CMD exec waitress-serve https_scanner:app
