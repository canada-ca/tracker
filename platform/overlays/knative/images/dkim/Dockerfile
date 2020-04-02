FROM python:3-slim AS prep-image

# Copy local code.
WORKDIR /dkim
COPY . ./

# Install dependancies.
RUN pip3 install --user Flask waitress

RUN pip3 install --user dkimpy
RUN pip3 install --user requests
RUN pip3 install --user dnspython
RUN pip3 install --user PyJWT

FROM scratch as runtime-image

COPY --from=prep-image /root/.local /root/.local
COPY --from=prep-image /dkim .

# Install python.
RUN apt-get install python3

# Run the web service on container startup. Using waitress, in this case.
CMD exec waitress-serve dkim_scanner:app