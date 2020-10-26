# Monitoring

This directory contains manifest files for Kubernetes deployments which provide log aggregation and observability for the scanners as well as the API to aid in facilitating the monitoring and debugging of behaviour within the application's backend.

## Grafana

Perform the following to configure the Grafana dashboard:

- Expose the `Grafana` deployment (located within the `scan-monitoring` namespace)

  `kubectl -n scan-monitoring expose deployment grafana --type=LoadBalancer --name=exposed-dashboard`

After a few moments, the LoadBalancer service should be assigned an external IP address.

- To view the assigned address:

  `kubectl -n scan-monitoring get svc exposed-dashboard`

Accessing the external IP address on the exposed port from a web browser will now lead to a login page.

The default credentials are `admin`/`admin`. After logging into Grafana, you will immediately be prompted to change the administrator password.

After this has been done, navigating to /dashboard/import will present the option to import a dashboard configuration from JSON. A provided configuration, `dashboard.config` can be found within the `grafana` directory.

Once the configuration has been imported, the `Scanners` dashboard should now be available. However, the dashboard does not yet have access to the datasources.

Navigating to /datasources/new will present the option to add various datasources. First, search for and select 'Prometheus'

- Update the address field with the corresponding Cluster-IP of the Prometheus service:

  `prometheus-service.scan-monitoring.svc.cluster.local`

Click "Save and Test", which should reflect a successful connection.

- Repeat the process for the Loki service:

  `loki.scanners.svc.cluster.local`

With the datasources configured, the dashboard should now provide log aggregation and traffic monitoring for services related to the scanning system.
