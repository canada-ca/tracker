# Azure overlay

This will deploy the application on Azure. It deploys the tracker as a cron job that runs every Monday, Wednesday, and Friday at midnight with dummy data that is pulled in through an `initContainer`. **This needs to be replaced going forward**. Both the `tracker` and `track-web` deployment connect to an external Mongo Database using the `TRACKER_MONGO_URI` environment variable. The value for the environment variable is currently configured in:

`tracker-secrets.yaml`

and needs to be changed. To determin the new string run `echo -n '{MONGO_URL}' | base64` with `{MONGO_URL}` being the URL to encode. Once that is done, **do not commit that** to a public repository!

Additionally to get auto-provisioning of SSL certificates working you need to change this line:

`- --acme.domains=tracker-dev.cdssandbox.xyz`

in `traefik-ingress-controller-deployment.yaml` to your actual domain.

You also need to change the IP address on this line:

`loadBalancerIP: 52.228.30.196`

in `traefik-ingress-service.yaml`

to your public IP.



