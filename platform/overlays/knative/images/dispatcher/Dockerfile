FROM ubuntu:20.04

# Copy local code to the container image.
ENV HOME /dispatcher
WORKDIR $HOME
COPY . ./

RUN apt-get install python3-pip

# Install dependencies.
RUN pip3 install Flask waitress
RUN pip3 install requests
RUN pip3 install PyJWT

# Run the web service on container startup. Using waitress, in this case.
CMD exec waitress-serve dispatcher:app
