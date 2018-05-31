printf "STARTING INIT CONTAINER\n"

# Make sure that AWS credentials have been configured
mkdir -p ~/.aws
cat > ~/.aws/credentials << EOF
[lambda]
aws_access_key_id=$TRACKER_AWS_KEY_ID
aws_secret_access_key=$TRACKER_AWS_SECRET
EOF 

printf "Created aws credentials\n"
cat > ~/.aws/config << EOF
[profile lambda]
region=$TRACKER_AWS_REGION
output=json
EOF

printf "Created aws configuration\n"

cd $TRACKER_HOME
tracker preprocess
tracker run --scan here ${TRACKER_AWS_SECRET+"--lambda --lambda-profile lambda"}
