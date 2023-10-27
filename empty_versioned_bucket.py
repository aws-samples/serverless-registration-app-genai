import boto3

#Edit the bucket name 
BUCKET = 'WebSiteBucket-XXXXXXXX'

s3 = boto3.resource('s3')
bucket = s3.Bucket(BUCKET)
bucket.object_versions.delete()

