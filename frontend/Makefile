S3_BUCKET_NAME = xxxxxxxx
AWS_PROFILE = default
DISTRIBUTION_ID = xxxxxxxx

.PHONY: deploy
build:
	aws s3 cp ./ s3://S3_BUCKET_NAME \
	--acl public-read \
	--profile AWS_PROFILE \
	--recursive \
	--exclude "*" \
	--include index.html \
	--include 404.html \
	
	aws cloudfront create-invalidation \
	--profile AWS_PROFILE \
	--distribution-id DISTRIBUTION_ID \
	--paths "/*"

