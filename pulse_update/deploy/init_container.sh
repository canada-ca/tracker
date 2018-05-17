printf "STARTING INIT CONTAINER\n"
# Make sure that AWS credentials have been configured
mkdir -p ~/.aws
cat > ~/.aws/credentials << EOF
[lambda]
aws_access_key_id=$PULSE_AWS_KEY_ID
aws_secret_access_key=$PULSE_AWS_SECRET
EOF 

printf "Created aws credentials\n"

cat > ~/.aws/config << EOF
[profile lambda]
region=$PULSE_AWS_REGION
output=json
EOF

printf "Created aws configuration\n"

printenv | grep -e "^PULSE" -e "^DOMAIN" -e "^PATH" | cat - /etc/crontab > /tmp/crontab && mv /tmp/crontab /etc/crontab 
printf "Loaded env variables into crontab file\n"

cron -f
