#!/usr/bin/env bash

set -e
shopt -s expand_aliases

if ! [ -x "$(command -v aws)" ]; then
  echo 'Error: AWS CLI is not installed.' >&2
  exit 1
fi

if ! [ -x "$(command -v npm)" ]; then
  echo 'Error: npm is not installed.' >&2
  exit 1
fi

if ! [ -x "$(command -v jq)" ]; then
  echo 'Error: jq is not installed.' >&2
  exit 1
fi

# Get user input for stack name
read -p "Enter your CloudFormation stack name [registration-app]: " stack_name
stack_name="${stack_name:=registration-app}"
echo "Using stack name $stack_name"

echo "Retrieving outputs from CloudFormation stack $stack_name..."
api_gateway_endpoint=$(aws cloudformation describe-stacks --stack-name "$stack_name" --query "Stacks[0].Outputs[?OutputKey=='APIGatewayEndpoint'].OutputValue" --output text)
cloudfront_distribution_id=$(aws cloudformation describe-stacks --stack-name "$stack_name" --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" --output text)
s3_bucket_name=$(aws cloudformation describe-stacks --stack-name "$stack_name" --query "Stacks[0].Outputs[?OutputKey=='WebS3BucketName'].OutputValue" --output text)
user_pool_id=$(aws cloudformation describe-stacks --stack-name "$stack_name" --query "Stacks[0].Outputs[?OutputKey=='UserPoolId'].OutputValue" --output text)
user_pool_client_id=$(aws cloudformation describe-stacks --stack-name "$stack_name" --query "Stacks[0].Outputs[?OutputKey=='UserPoolClientId'].OutputValue" --output text)
region=$(aws cloudformation describe-stacks --stack-name "$stack_name" --query "Stacks[0].Outputs[?OutputKey=='Region'].OutputValue" --output text)
identity_pool_id=$(aws cloudformation describe-stacks --stack-name "$stack_name" --query "Stacks[0].Outputs[?OutputKey=='IdentityPoolId'].OutputValue" --output text)

# Output the results
echo "API Gateway URL: $api_gateway_endpoint"
echo "CloudFront Distribution ID: $cloudfront_distribution_id"
echo "Cognito User Pool ID: $user_pool_id"
echo "Cognito User Pool Client: $user_pool_client_id"
echo "Region: $region"
echo "Identity Pool ID: $identity_pool_id"

echo "Replacing stack output values in amplify.js"
amplify_js="./frontend/src/amplify.js"
cp $amplify_js.orig $amplify_js
SED_CMD="sed -i"
if [[ $(uname -s) == Darwin ]]; then
  SED_CMD='sed -i ""'
fi
$SED_CMD "s|USER_POOL_ID|$user_pool_id|g" $amplify_js
$SED_CMD "s|USER_POOL_CLIENT_ID|$user_pool_client_id|g" $amplify_js
$SED_CMD "s|IDENTITY_POOL_ID|$identity_pool_id|g" $amplify_js
$SED_CMD "s|REGION|$region|g" $amplify_js
$SED_CMD "s|ENDPOINT|$api_gateway_endpoint|g" $amplify_js

echo "Installing Node.js packages..."
cd frontend/ && npm install

echo "Building distribution for deployment..."
npm run build && cd build/

echo "Copying build to S3..."
aws s3 sync . s3://$s3_bucket_name/

echo "Creating CloudFront invalidation..."
invalidation_output=$(aws cloudfront create-invalidation --distribution-id $cloudfront_distribution_id --paths "/*")
invalidation_id=$(echo $invalidation_output | jq -r '.Invalidation.Id')

# Wait for CloudFront invalidation to complete
aws cloudfront wait invalidation-completed --distribution-id $cloudfront_distribution_id --id $invalidation_id

# Get CloudFront domain name
cloudfront_domain_name=$(aws cloudfront list-distributions --query "DistributionList.Items[?Id=='$cloudfront_distribution_id'].DomainName" --output text)

echo "CloudFront invalidation complete. Visit your CloudFront URL to continue: https://$cloudfront_domain_name/"
