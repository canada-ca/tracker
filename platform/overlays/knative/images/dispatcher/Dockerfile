FROM python:3.7-slim

# Copy local code to the container image.
ENV HOME /dispatcher
WORKDIR $HOME
COPY . ./

# Install production dependencies.
RUN pip3 install Flask gunicorn
RUN pip3 install requests
RUN pip3 install PyJWT

# Run the web service on container startup. Here we use the gunicorn
# webserver, with one worker process and 8 threads.
# For environments with multiple CPU cores, increase the number of workers
# to be equal to the cores available.
CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 dispatcher:app
