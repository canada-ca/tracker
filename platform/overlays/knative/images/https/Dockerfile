FROM python:3-slim AS prep-image

# Copy local code.
WORKDIR /https
COPY . ./

# Install dependancies.
RUN pip3 install --user Flask waitress

RUN pip3 install --user pshtt
RUN pip3 install --user PyJWT

FROM scratch as runtime-image

COPY --from=prep-image /root/.local /root/.local
COPY --from=prep-image /https .

# Install python.
RUN apt-get install python3

# Run the web service on container startup. Using waitress, in this case.
CMD exec waitress-serve https_scanner:app