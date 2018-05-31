# Production data update process:
#
# Run a fresh scan, update the database, and upload data to S3.
# Enable Lambda mode, using Lambda AWS profile set up in production.
update_production:
	tracker run --scan here --upload --lambda --lambda-profile lambda

# Development data update process:
#
# Don't scan or download latest data (rely on local cache), update database.
update_development:
	tracker run --scan skip
