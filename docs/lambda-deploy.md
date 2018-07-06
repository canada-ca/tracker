## Using lambda scanners

[domain-scan](https://github.com/cds-snc/domain-scan) is capable of massively parallel scanning through use of AWS Lambda.
The domain-scan repo has [its own documentation](https://github.com/cds-snc/domain-scan/docs/lambda.md) on the subject that we encourage you to go read, but here are some basics to get you setup and going.


### Build
To deploy the functions to Lambda, first an **environment** (compiled and packaged dependencies) must be built. This can technically be done on any computer, but most likely when actually attempted the packages will not work on Lambda, as some dependencies are compiled special for different platforms.

To get around this the environments are built within a docker container that is very similar to the execution environment of Lambda. The [dhs-ncats/lambda_functions](https://github.com/dhs-ncats/lambda_functions) repository is exclusively for this purpose. Their repo contains instructions on usage if needed.
```bash
git clone https://github.com/dhs-ncats/lambda_functions.git
cd lambda_functions
docker-compose build
docker-compose up
```

This will result in three `.zip` files, of which we will be using `pshtt.zip` and `sslyze.zip`.

Once these zip files are built, copy them to the `lambda/envs` subdirectory of `domain-scan`.


### AWS Setup
There are two pieces required from AWS before the scanners can be deployed and used.
1. An IAM role with the `AWSLambdaFullAccess` policy given to it needs to be created.
2. API credentials need to be created/retrieved for a user with access to Lambda.

We suggest that a new IAM User is created for the API credentials that is limited in access to just what is needed.
Once the user is created, create a set of Access Keys from the `Security Credentials` tab of the IAM user summary. Make sure to store the Secret Key somewhere, as it cannot be retrieved after creation of the key pair.  
After retrieving the credentials, also make a note of the ARN of the new role you created, as you will need it as well in the next section.


### Deploy
Once the environments have been created, and AWS prepared, we now can actually deploy the scanners. There is a script within the `domain-scan` repository ready made to do just that, all it requires is some small setup.
1. install the `awscli` Python package (preferably in a virtualenv)
```bash
python -m venv .env
. .env/bin/activate
pip install awscli
```
2. Configure the client with API credentials for an AWS user with permission to modify Lambda. 
```bash
$ aws configure --profile lambda
AWS Access Key ID [None]: **ACCESS-ID-HERE**
AWS Secret Access Key [None]: **SECRET-ACCESS-KEY**
Default region name [None]: ca-central-1
Default output format [None]: json
```
3. Set the environment variable `AWS_LAMBDA_ROLE` environment variable to the ARN of the role we created with the `AWSLambdaFullAccess` polcy.
```bash
export AWS_LAMBDA_ROLE=**ARN**
```
4. Deploy the scanners
```bash
./lambda/deploy.sh pshtt --create
./lambda/deploy.sh pshtt --create
```

**NOTE**: If you are updating the deployed scanners instead of creating them from nothing, remove the `--create` option from the above commands.

### Usage
To use the Lambda scanners, all that is required is to append `--lambda` onto the end of the `tracker run` or `tracker update` commands. This requires that the AWS client has already been configured (which creates some simple configuration files in the $HOME directory).  
In addition to that flag, you may pass `--lambda-profile PROFILE_NAME` to use a named profile. This also assumes that the specified profile has been configured locally.

The configuration can be done interactively by using the `aws configuration` command as was done previously, or by writing out a configuration file manually. (An example of this can be found in the [tracker deploy directory](../tracker/deploy/scan.sh))

Assuming that your environment is setup, and you have some data to scan (See the [Local Deployment Walkthrough](local-instructions.md) to get setup if not), run the following command to execute a scan using the Lambda functions:
```bash
tracker run --lambda --lambda-prile lambda
```
