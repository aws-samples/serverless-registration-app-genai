#!/usr/bin/env bash

set -e

# Get user input for stack name
# read -p "Enter the name of the CloudFormation stack: " stack_name

stack_name="registration-app"

# Get outputs from CloudFormation stack
api_gateway_endpoint=$(aws cloudformation describe-stacks --stack-name "$stack_name" --query "Stacks[0].Outputs[?OutputKey=='APIGatewayEndpoint'].OutputValue" --output text)
cloudfront_distribution_id=$(aws cloudformation describe-stacks --stack-name "$stack_name" --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" --output text)
s3_bucket_name=$(aws cloudformation describe-stacks --stack-name "$stack_name" --query "Stacks[0].Outputs[?OutputKey=='WebS3BucketName'].OutputValue" --output text)
user_pool_id=$(aws cloudformation describe-stacks --stack-name "$stack_name" --query "Stacks[0].Outputs[?OutputKey=='UserPoolId'].OutputValue" --output text)
user_pool_client_id=$(aws cloudformation describe-stacks --stack-name "$stack_name" --query "Stacks[0].Outputs[?OutputKey=='UserPoolClientId'].OutputValue" --output text)
region=$(aws cloudformation describe-stacks --stack-name "$stack_name" --query "Stacks[0].Outputs[?OutputKey=='Region'].OutputValue" --output text)
identity_pool_id=$(aws cloudformation describe-stacks --stack-name "$stack_name" --query "Stacks[0].Outputs[?OutputKey=='IdentityPoolId'].OutputValue" --output text)

if [ -z "$region" ]
then
  region="us-east-1"
fi

# Output the results
echo "API Gateway URL: $api_gateway_endpoint"
echo "CloudFront Distribution ID: $cloudfront_distribution_id"
echo "Cognito User Pool ID: $user_pool_id"
echo "Cognito User Pool Client: $user_pool_client_id"
echo "Region: $region"
echo "Identity Pool ID: $identity_pool_id"

# Replace stack output values in amplify.js
amplify_js="./frontend/src/amplify.js"
sed -i "s/USER_POOL_ID/$user_pool_id/g" $amplify_js
sed -i "s/USER_POOL_CLIENT_ID/$user_pool_client_id/g" $amplify_js
sed -i "s/IDENTITY_POOL_ID/$identity_pool_id/g" $amplify_js
sed -i "s/REGION/$region/g" $amplify_js
sed -i "s@ENDPOINT@$api_gateway_endpoint@g" $amplify_js

# Move to frontend and install
cd frontend/ && npm install

# Create distribution for deployment
npm run build && cd build/

# Sync distribution with S3
aws s3 sync . s3://$s3_bucket_name/

# Create CloudFront invalidation and capture id for next step
invalidation_output=$(aws cloudfront create-invalidation --distribution-id $cloudfront_distribution_id --paths "/*")
invalidation_id=$(echo "$invalidation_output" | grep -oP '(?<="Id": ")[^"]+')

# Wait for CloudFront invalidation to complete
aws cloudfront wait invalidation-completed --distribution-id $cloudfront_distribution_id --id $invalidation_id

# Get CloudFront domain name and validate
cloudfront_domain_name=$(aws cloudfront list-distributions --query "DistributionList.Items[?Id=='$cloudfront_distribution_id'].DomainName" --output text)

echo "The invalidation is now complete. Please visit your CloudFront URL to continue: https://$cloudfront_domain_name/"
