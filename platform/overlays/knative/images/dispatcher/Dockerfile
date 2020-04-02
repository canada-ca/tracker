FROM python:3.7-slim

# Copy local code to the container image.
ENV HOME /dispatcher
WORKDIR $HOME
COPY . ./

# Install production dependencies.
RUN pip3 install Flask gunicorn
RUN pip3 install requests
RUN pip3 install PyJWT

# Run the web service on container startup. Using waitress, in this case.
CMD exec waitress-serve dispatcher:app
