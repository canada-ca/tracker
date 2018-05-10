# Production data update process:
#
# Run a fresh scan, update the database, and upload data to S3.
# Enable Lambda mode, using Lambda AWS profile set up in production.
update_production:
	pulse run --scan here --upload --lambda --lambda-profile lambda

# Development data update process:
#
# Don't scan or download latest data (rely on local cache), update database.
update_development:
	pulse run --scan skip

# downloads latest snapshot of data locally
# Pending cloud.gov production bucket:
# cg-4adefb86-dadb-4ecf-be3e-f1c7b4f6d084
# Pending cloud.gov backup bucket:
# cg-72ce4caf-d81b-4771-9b96-3624b5554587
data_init:
	pulse download
