#!/bin/bash

aws lambda get-function --function-name task_sslyze > /dev/null
SSLYZE=$?
aws lambda get-function --function-name task_pshtt > /dev/null
PSHTT=$?

LAMBDA=0
if [[ $SSLYZE -eq 0 && $PSHTT -eq 0 ]]
then
    LAMBDA=1
fi 

cd $TRACKER_HOME
tracker preprocess
if [[ $LAMBDA -eq 1 ]]
then
    tracker run --scan here --lambda --lambda-profile lambda
else
    tracker run --scan here
fi
rm -rf data/output
